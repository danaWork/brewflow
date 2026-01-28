export default async function OwnerOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {id}</p>
      <p>Update order status and details</p>
    </div>
  );
}
