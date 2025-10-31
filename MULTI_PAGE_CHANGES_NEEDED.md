# Mudanças Necessárias para Suporte Multi-Page

## Status da Implementação

### ✅ Completado:
- FASE 0: Schemas atualizados (isActive added to regions, offer_types, niches)
- FASE 1: Novos schemas criados (facebook_pages, offer_pages)
- FASE 1: Schema offers mantém facebookUrl/pageName temporariamente para migração
- FASE 1: Schema snapshots com pageId (opcional durante migração)
- FASE 1: Script de migração criado em `packages/db/src/migrate-to-multi-pages.ts`
- FASE 2: Validators atualizados para aceitar `facebookUrls` (array)

### 🔄 Pendente de Implementação Manual:

#### packages/api/src/routers/offer.ts

O arquivo precisa ser completamente refatorado. As mudanças principais são:

**1. Imports - adicionar:**
```typescript
import { facebookPages } from "@nodezao/db/schema/facebook-pages";
import { offerPages } from "@nodezao/db/schema/offer-pages";
import { inArray } from "drizzle-orm"; // já pode estar importado
```

**2. getAll procedure:**
- Remover referências a `offers.facebookUrl` e `offers.pageName`
- Após buscar offers, fazer join com `offerPages` e `facebookPages` para trazer as páginas
- Retornar cada offer com array de `pages`

**3. getById procedure:**
- Remover `facebookUrl` e `pageName` do select
- Buscar páginas relacionadas via `offerPages` + `facebookPages`
- Incluir páginas no retorno

**4. create procedure:**
- Receber `facebookUrls` do input (já validado)
- Criar offer SEM urls
- Para cada url em `facebookUrls`:
  - Verificar se página já existe em `facebookPages`
  - Se não existir, criar nova página
  - Criar relacionamento em `offerPages` (primeira URL = isPrimary: true)

**5. update procedure:**
- Se `facebookUrls` fornecido:
  - Deletar todos os registros de `offerPages` para esse offer
  - Re-criar relacionamentos com as novas URLs

**6. delete procedure:**
- Já funciona via cascade delete do schema

**7. getStats procedure:**
- Ao agregar snapshots, agregar por `offerId` (não por page individual)
- Somar criativos de todas as páginas de um offer

---

#### packages/api/src/routers/snapshot.ts

**Mudanças necessárias:**

**1. create procedure:**
- Já recebe `pageId` (adicionado no schema)
- Validar que pageId pertence ao offerId

**2. getDelta procedure:**
- Agregar snapshots por `offerId` ou permitir filtro por `pageId`
- Retornar delta total + delta por página

**3. getByOfferId procedure:**
- Permitir filtro opcional por `pageId`
- Se não filtrado, retornar todos snapshots (todas as páginas)

---

#### apps/server/src/jobs/scrape-offers.job.ts

**Nova lógica:**

```typescript
// Buscar offers ativas COM suas páginas
const offersWithPages = await db.query.offers.findMany({
  where: eq(offers.isActive, true),
  with: {
    offerPages: {
      with: {
        page: true
      }
    }
  }
});

// Para cada offer
for (const offer of offersWithPages) {
  // Para cada página da offer
  for (const offerPage of offer.offerPages) {
    const result = await scrapeFacebookAdLibrary(offerPage.page.url);

    if (result.success) {
      // Criar snapshot com pageId
      await db.insert(creativeSnapshots).values({
        offerId: offer.id,
        pageId: offerPage.page.id,
        creativeCount: result.creativeCount,
      });

      // Atualizar pageName se necessário
      if (result.pageName && result.pageName !== offerPage.page.pageName) {
        await db.update(facebookPages)
          .set({ pageName: result.pageName, updatedAt: new Date() })
          .where(eq(facebookPages.id, offerPage.page.id));
      }
    }

    // Delay entre páginas
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  }
}
```

---

#### Frontend: apps/web/src/routes/offers/index.tsx

**Mudanças necessárias:**

**1. CreateOfferModal:**
- Substituir single input `facebookUrl` por array de inputs
- Adicionar botão "+ Adicionar Página"
- Primeira URL sempre é primary
- Validação: URLs únicas, máximo 10

**2. Offer Cards:**
- Se `offer.pages.length === 1`: mostrar como hoje
- Se `offer.pages.length > 1`:
  - Mostrar total consolidado de criativos
  - Adicionar Collapsible com lista de páginas
  - Cada página: nome, count, delta individual

---

#### Frontend: apps/web/src/routes/offers/$offerId.tsx

**Mudanças necessárias:**

**1. Adicionar seletor de página:**
```typescript
const [selectedPageId, setSelectedPageId] = useState<number | 'all'>('all');

<Select value={String(selectedPageId)} onValueChange={setSelectedPageId}>
  <SelectItem value="all">📊 Todas as Páginas (Total)</SelectItem>
  {offer.pages.map(page => (
    <SelectItem key={page.pageId} value={String(page.pageId)}>
      {page.pageName || 'Página sem nome'}
    </SelectItem>
  ))}
</Select>
```

**2. Filtrar dados do gráfico:**
- Se `selectedPageId === 'all'`: agregar snapshots por data
- Se `selectedPageId` específico: filtrar apenas snapshots daquela página

**3. Seção de páginas associadas:**
- Listar todas as páginas
- Indicar qual é a primária
- Link para cada página no Facebook

---

## Ordem de Execução Recomendada

1. **Rodar migração do banco:**
   ```bash
   # Criar tabelas novas
   pnpm db:push

   # Migrar dados existentes
   npx tsx packages/db/src/migrate-to-multi-pages.ts

   # Remover campos antigos (opcional, ou manter para retrocompat)
   # Editar offers.ts, remover facebookUrl e pageName
   # pnpm db:push
   ```

2. **Backend API:**
   - Atualizar `offer.ts` router
   - Atualizar `snapshot.ts` router
   - Testar endpoints via API

3. **Scraping:**
   - Atualizar `scrape-offers.job.ts`
   - Testar scraping manual

4. **Frontend:**
   - Adicionar collapsible component
   - Atualizar formulário
   - Atualizar dashboard
   - Atualizar página de detalhes

---

## Notas Importantes

- Os campos `facebookUrl` e `pageName` foram mantidos TEMPORARIAMENTE no schema `offers` para permitir a migração
- Após rodar a migração e confirmar que tudo funciona, esses campos podem ser removidos
- O script de migração é idempotente (pode ser rodado múltiplas vezes)
- Todas as validações já estão no lugar (`facebookUrls` array, min 1, max 10)
