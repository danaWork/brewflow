export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Edit Menu Item</h1>
      <p>Editing item ID: {id}</p>
    </div>
  );
}
