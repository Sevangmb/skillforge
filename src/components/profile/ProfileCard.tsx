import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";

interface ProfileCardProps {
  user: User;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const levelProgress = (user.profile.level / 50) * 100; // Assuming max level 50 for progress bar

  return (
    <Card className="bg-secondary border-0 shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile avatar" />
          <AvatarFallback>{user.profile.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-headline">{user.profile.displayName}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4 text-accent" />
            <span>{user.profile.totalPoints.toLocaleString()} Points</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-xs text-muted-foreground mb-1">Level {user.profile.level}</div>
        <Progress value={levelProgress} className="h-2" />
      </CardContent>
    </Card>
  );
}
