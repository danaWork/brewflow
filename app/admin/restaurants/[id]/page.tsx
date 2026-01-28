export default async function RestaurantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Restaurant Details</h1>
      <p>Restaurant ID: {id}</p>
    </div>
  );
}
