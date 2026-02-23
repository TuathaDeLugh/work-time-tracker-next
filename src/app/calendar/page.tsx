import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkLogs, getUserProfile } from "@/lib/api-services";
import CalendarClient from "./_components/CalendarClient";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const events = await getWorkLogs(session.user.id);
  const userProfile = await getUserProfile(session.user.id);

  const workDurationMs = userProfile 
    ? (userProfile.workHours * 3600000) + (userProfile.workMinutes * 60000)
    : 8 * 3600000;

  return (
    <CalendarClient 
      initialEvents={events} 
      timeFormat={userProfile?.timeFormat || "12h"} 
      workDurationMs={workDurationMs}
    />
  );
}
