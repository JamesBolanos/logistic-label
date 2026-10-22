type ProductsEvent = {
  request: Request;
  locals: { user: { id: string } | null };
};

export function GET(event: Pick<ProductsEvent, 'locals'>): Promise<Response>;
export function POST(event: ProductsEvent): Promise<Response>;
