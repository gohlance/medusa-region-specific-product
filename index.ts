//medusajs-storefront/src/lib/data/index.ts

//1. Locate the following function in index.ts

export const getProductsList = cache(async function ({
  pageParam = 0,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: StoreGetProductsParams
  countryCode: string
}): Promise<{
  response: { products: ProductPreviewType[]; count: number }
  nextPage: number | null
  queryParams?: StoreGetProductsParams
}> {
  const limit = queryParams?.limit || 12

  const region = await getRegion(countryCode)

  if (!region) {
    return emptyResponse
  }

  const { products, count } = await medusaClient.products
    .list(
      {
        limit,
        offset: pageParam,
        region_id: region.id,
        ...queryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then((res) => res)
    .catch((err) => {
      throw err
    })
  //*****This is the modification
  // Filter products based on metadata (e.g., metadata.region)
  const filteredProducts = products.filter((product) => {
    const productRegion = product.metadata?.region

    if (!productRegion) {
      return true // If there's no metadata, include the product by default
    }

    if (!productRegion) {
      return true // If there's no metadata, include the product by default
    }
    
    if (!countryCode) {
      // If the customer's region is SG, show products with 'SG' or 'ALL' in metadata
      return productRegion === countryCode
    } else {
      // For other regions, show only products with 'ALL'
      return productRegion === 'ALL'
    }
  })

  const transformedProducts = filteredProducts.map((product) => {
    return transformProductPreview(product, region!)
  })

  const nextPage = count > pageParam + 1 ? pageParam + 1 : null

  return {
    response: { products: transformedProducts, count },
    nextPage,
    queryParams,
  }
})
