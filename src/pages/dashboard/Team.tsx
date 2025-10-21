import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TeamMembersTable } from "@/components/dashboard/team/TeamMembersTable";
import { InviteMemberSheet } from "@/components/dashboard/team/InviteMemberSheet";
import { EditMemberRoleDialog } from "@/components/dashboard/team/EditMemberRoleDialog";

export type TeamMember = {
  id: string;
  role: 'admin' | 'editor';
  users: {
    email: string;
  }
};

const Team = () => {
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  const fetchTeamMembers = async () => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        id,
        role,
        users ( email )
      `)
      .eq("restaurant_id", user.id);
    if (error) throw error;
    // Supabase returns the user profile in a nested object, so we adjust the type assertion
    return data as unknown as TeamMember[];
  };

  const { data: members, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers", user?.id],
    queryFn: fetchTeamMembers,
    enabled: !!user,
  });

  const handleEditRole = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsEditDialogOpen(true);
  };

  return (
    <FeatureGuard requiredPlan="Premium" featureName="Gestão de Equipe">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Equipe</h1>
          <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Convidar Membro
          </Button>
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}
        {error && <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível carregar os membros da equipe.</AlertDescription></Alert>}
        {members && <TeamMembersTable members={members} onEditRole={handleEditRole} />}

        <InviteMemberSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
        {memberToEdit && (
          <EditMemberRoleDialog 
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            member={memberToEdit}
          />
        )}
      </div>
    </FeatureGuard>
  );
};

export default Team;