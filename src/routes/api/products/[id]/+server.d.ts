type ProductEvent = {
  params: { id: string };
  request: Request;
  locals: { user: { id: string } | null };
};

export function PATCH(
  event: Pick<ProductEvent, 'params' | 'request' | 'locals'>
): Promise<Response>;
export function DELETE(event: Pick<ProductEvent, 'params' | 'locals'>): Promise<Response>;
