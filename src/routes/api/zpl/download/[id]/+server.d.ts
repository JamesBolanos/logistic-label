export function GET(event: {
  params: { id: string };
  request: Request;
  url: URL;
  locals: { user: { id: string } | null };
}): Promise<Response>;
