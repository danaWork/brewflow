export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {id}</p>
      <p>Track your order status here</p>
    </div>
  );
}
