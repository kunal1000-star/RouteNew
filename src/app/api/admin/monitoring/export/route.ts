export async function GET() {
  const csv = 'metric,value\nexample,1\n';
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="monitoring.csv"'
    }
  });
}

export async function OPTIONS() { return new Response(null, { status: 200 }); }
