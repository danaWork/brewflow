export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Edit Restaurant</h1>
      <p>Editing restaurant ID: {id}</p>
    </div>
  );
}
