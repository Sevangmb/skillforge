import { User } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Gem } from "lucide-react";

interface LeaderboardProps {
  users: User[];
}

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 2) return <Gem className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm w-5 text-center">{rank + 1}</span>;
};

export default function Leaderboard({ users }: LeaderboardProps) {
  return (
    <div className="p-2">
      <h2 className="text-lg font-headline text-primary mb-2 px-2">Leaderboard</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <RankIcon rank={index} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/80x80.png`} data-ai-hint="profile avatar" />
                      <AvatarFallback>{user.profile.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[100px]">{user.profile.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{user.profile.totalPoints.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
