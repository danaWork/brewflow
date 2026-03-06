import { redirect } from "next/navigation";
import ReceiptsClient from "@/components/owner/pos/ReceiptsClient";
import { getUserSession } from "@/app/actions/auth";

export default async function ReceiptsPage() {
    const session = await getUserSession();

    if (!session || !session.branchId) {
        redirect("/login");
    }

    return <ReceiptsClient branchId={session.branchId} />;
}
