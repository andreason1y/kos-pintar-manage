import { usePlan } from "@/lib/plan-context";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Crown } from "lucide-react";

export default function UpgradeModal() {
  const { showUpgradeModal, upgradeMessage, upgradeCta, upgradeLink, dismissUpgrade } = usePlan();
  const navigate = useNavigate();

  const handleAction = () => {
    dismissUpgrade();
    if (upgradeLink) {
      window.open(upgradeLink, "_blank");
    } else {
      navigate("/#harga");
    }
  };

  return (
    <AlertDialog open={showUpgradeModal} onOpenChange={(open) => { if (!open) dismissUpgrade(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-2">
            <Crown size={24} className="text-accent" />
          </div>
          <AlertDialogTitle className="text-center">Batas Paket Tercapai</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {upgradeMessage || "Upgrade rencana Anda untuk kelola lebih banyak kamar."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={handleAction}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
          >
            {upgradeCta}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full">Nanti Saja</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
