import { requireBranchManagerShopSettings } from '@/lib/roleGuard';
import { getPrinterConfigAction, getStaffMembersForBranch } from '@/app/actions/owner';
import OwnerSettingsFormClient from '@/components/owner/OwnerSettingsFormClient';
import StaffManagementClient from '@/components/owner/StaffManagementClient';
import PrinterSettingsClient from '@/components/owner/PrinterSettingsClient';

export default async function OwnerSettingsPage() {
    await requireBranchManagerShopSettings();

    const { staff, error } = await getStaffMembersForBranch();
    const printerRes = await getPrinterConfigAction();

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Restaurant Settings</h1>
            <p className="text-gray-500 mb-8">Configure your restaurant details and security settings</p>

            {error && (
                <div className="mb-6 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                <PrinterSettingsClient
                    initialHost={printerRes.success ? printerRes.config.host : null}
                    initialPort={printerRes.success ? printerRes.config.port : null}
                />
                <StaffManagementClient initialStaff={staff} />
                <OwnerSettingsFormClient />
            </div>
        </div>
    );
}
