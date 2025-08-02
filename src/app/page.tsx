import Dashboard from "@/components/dashboard/Dashboard";
import { getSkillTree, getUsers } from "@/data/mock-data";

export default function Home() {
  // In a real application, this data would be fetched from Firestore.
  const skills = getSkillTree();
  const users = getUsers();
  const currentUser = users[0]; // Mock current user

  return (
    <main className="min-h-screen bg-background">
      <Dashboard skills={skills} users={users} currentUser={currentUser} />
    </main>
  );
}
