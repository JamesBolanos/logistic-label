type SettingsEvent = {
  request: Request;
  locals: { user: { id: string } | null };
};

export function GET(event: Pick<SettingsEvent, 'locals'>): Promise<Response>;
export function POST(event: SettingsEvent): Promise<Response>;
export function PATCH(event: SettingsEvent): Promise<Response>;
