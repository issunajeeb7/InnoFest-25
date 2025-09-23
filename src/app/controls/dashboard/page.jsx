"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
    CircleUser,
    Menu,
    Package2,
    Search,
    Users,
    Lightbulb,
    House,
    Presentation,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { notifyRoomAllocation } from "@/utils/notifyRoomAllocation";
import { useSession } from "@/context/SessionContext";
import CopyableText from "@/components/CopyableText";

export default function Dashboard() {
    const [teams, setTeams] = useState([]);
    const [uniqueProblemStatements, setUniqueProblemStatements] = useState(0);
    const [dayScholars, setDayScholars] = useState(0);
    const [presentationCount, setPresentationCount] = useState(0);
    const { session, loading } = useSession();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from("teams")
                    .select(
                        "id, team_leader_id, team_name, theme, problem_statement_number, problem_statement_title, vegetarian_count, resources_required, day_scholar_count, room_allotted, presentation, user_id, team_members(full_name, email, gender, is_leader)"
                    )
                    .order("team_name");

                if (error) throw error;

                setTeams(data);

                const uniqueProblemStatementNumbers = new Set(
                    data.map((teams) => teams.problem_statement_number)
                );

                setUniqueProblemStatements(uniqueProblemStatementNumbers.size);

                const totalDayScholars = data.reduce(
                    (sum, teams) => sum + teams.day_scholar_count,
                    0
                );

                setDayScholars(totalDayScholars);

                const countPresentations = data.filter(
                    (team) =>
                        team.presentation !== null && team.presentation !== ""
                ).length;

                setPresentationCount(countPresentations);
            } catch (error) {
                console.error("Error fetching team details:", error);
            }
        };

        fetchTeamDetails();

        const subscription = supabase
            .channel("teams_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "teams" },
                (payload) => {
                    // console.log("Change received!", payload);
                    fetchTeamDetails();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const teamsWithFemaleCount = teams.map((team) => {
        const femaleCount = team.team_members.filter(
            (member) => member.gender === "Female"
        ).length;
        return {
            ...team,
            femaleCount,
        };
    });

    const handleRoomAllocation = async (selectedRoom, teamId) => {
        try {
            const { error } = await supabase
                .from("teams")
                .update({ room_allotted: selectedRoom })
                .eq("id", teamId);

            if (error) throw error;

            // Find the team to get leader's email
            const team = teams.find(t => t.id === teamId);
            const teamLeader = team?.team_members.find(member => member.is_leader);
            
            if (teamLeader?.email) {
                try {
                    await notifyRoomAllocation({
                        to: teamLeader.email,
                        roomAllotted: selectedRoom,
                    });
                } catch (error) {
                    console.error("Error sending room allocation email:", error);
                }
            }
        } catch (error) {
            console.error("Error updating room:", error);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                Loading...
            </div>
        );
    }

    if (session.user.email !== "issunajeeb7@gmail.com") {
        router.push("/");
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                <nav className="hidden flex-col gap-6 text-md font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-md font-semibold md:text-base"
                    >
                        <Package2 className="h-6 w-6" />
                        <span className="sr-only">DUK InnoFest</span>
                    </Link>
                    <Link
                        href="#"
                        className="text-foreground transition-colors hover:text-foreground"
                    >
                        Dashboard
                    </Link>
                </nav>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">
                                Toggle navigation menu
                            </span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <nav className="grid gap-6 text-lg font-medium">
                            <Link
                                href="#"
                                className="flex items-center gap-2 text-lg font-semibold"
                            >
                                <Package2 className="h-6 w-6" />
                                <span className="sr-only">DUK InnoFest</span>
                            </Link>
                            <Link href="#" className="hover:text-foreground">
                                Dashboard
                            </Link>
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <form className="ml-auto flex-1 sm:flex-initial">
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search teams..."
                                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                            />
                        </div>
                    </form>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full"
                            >
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">
                                    Toggle user menu
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href={"/controls/dashboard/settings"}>
                                    Settings
                                </Link>{" "}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href={"/logout"}>Logout</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Card x-chunk="dashboard-01-chunk-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Teams
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {teams.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                teams in total
                            </p>
                        </CardContent>
                    </Card>
                    <Card x-chunk="dashboard-01-chunk-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Problem statements
                            </CardTitle>
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {uniqueProblemStatements}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {teams.length - uniqueProblemStatements} common
                                problem statement
                            </p>
                        </CardContent>
                    </Card>
                    <Card x-chunk="dashboard-01-chunk-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total dayscholars
                            </CardTitle>
                            <House className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dayScholars}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {6 * teams.length - 108} hostellers
                            </p>
                        </CardContent>
                    </Card>
                    <Card x-chunk="dashboard-01-chunk-3">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Submissions
                            </CardTitle>
                            <Presentation className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {presentationCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                out of {teams.length} presentation so far
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <Card
                        className="xl:col-span-2"
                        x-chunk="dashboard-01-chunk-4"
                    >
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Teams</CardTitle>
                                <CardDescription>
                                    Confirmed teams
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead className="">
                                            Problem Statement
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Room
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Presentation
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.length > 0 ? (
                                        teamsWithFemaleCount.map(
                                            (team, index) => (
                                                <TableRow key={team.id}>
                                                    <TableCell className="">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link
                                                            href={`/team/${team.id}`}
                                                            className="font-medium"
                                                            target="_blank"
                                                        >
                                                            <CopyableText
                                                                text={
                                                                    team.team_name
                                                                }
                                                            ></CopyableText>
                                                        </Link>
                                                        <br />
                                                        <br />
                                                        <p>Team leader</p>
                                                        <div className=" text-sm text-muted-foreground md:inline">
                                                            <CopyableText
                                                                text={
                                                                    team.team_members.find(member => member.is_leader)?.full_name || 'No leader assigned'
                                                                }
                                                            ></CopyableText>
                                                        </div>
                                                        <div className=" text-sm text-muted-foreground md:inline">
                                                            <CopyableText
                                                                text={
                                                                    team.team_members.find(member => member.is_leader)?.email || 'No email available'
                                                                }
                                                            ></CopyableText>
                                                        </div>
                                                        <div>
                                                            Number of females{" "}
                                                            {team.femaleCount}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {team.team_members.map(
                                                            (
                                                                member,
                                                                memberIndex
                                                            ) => (
                                                                <p
                                                                    key={
                                                                        memberIndex
                                                                    }
                                                                >
                                                                    {memberIndex >
                                                                        0 && ""}
                                                                    <b>
                                                                        <CopyableText
                                                                            className="mb-2"
                                                                            text={
                                                                                member.full_name
                                                                            }
                                                                        ></CopyableText>{" "}
                                                                        <span className="font-normal">
                                                                            (
                                                                            {
                                                                                member
                                                                                    .gender[0]
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </b>
                                                                    <br />
                                                                    <CopyableText
                                                                        text={
                                                                            member.email
                                                                        }
                                                                    ></CopyableText>
                                                                    <br />
                                                                    <br />
                                                                </p>
                                                            )
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="">
                                                        <b>Theme: </b>
                                                        <CopyableText
                                                            text={team.theme}
                                                        ></CopyableText>
                                                        <br />
                                                        <b>
                                                            <CopyableText
                                                                text={
                                                                    team.problem_statement_number
                                                                }
                                                            ></CopyableText>
                                                        </b>
                                                        {" - "}
                                                        <CopyableText
                                                            text={
                                                                team.problem_statement_title
                                                            }
                                                        ></CopyableText>
                                                    </TableCell>
                                                    <TableCell className="">
                                                        <Select
                                                            defaultValue={
                                                                team.room_allotted
                                                            }
                                                            onValueChange={(
                                                                selectedRoom
                                                            ) =>
                                                                handleRoomAllocation(
                                                                    selectedRoom,
                                                                    team.id
                                                                )
                                                            }
                                                            disabled
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue
                                                                    placeholder={
                                                                        team.room_allotted
                                                                            ? team.room_allotted
                                                                            : "Not allotted"
                                                                    }
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="22">
                                                                    22
                                                                </SelectItem>
                                                                <SelectItem value="102">
                                                                    102
                                                                </SelectItem>
                                                                <SelectItem value="103">
                                                                    103
                                                                </SelectItem>
                                                                <SelectItem value="104">
                                                                    104
                                                                </SelectItem>
                                                                <SelectItem value="107">
                                                                    107
                                                                </SelectItem>
                                                                <SelectItem value="136">
                                                                    136
                                                                </SelectItem>
                                                                <SelectItem value="202">
                                                                    202
                                                                </SelectItem>
                                                                <SelectItem value="216">
                                                                    216
                                                                </SelectItem>
                                                                <SelectItem value="217">
                                                                    217
                                                                </SelectItem>
                                                                <SelectItem value="219">
                                                                    219
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="">
                                                        {team.presentation ? (
                                                            <Link
                                                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/presentation/${team.presentation}`}
                                                                target="_blank"
                                                            >
                                                                <Badge className="text-xs">
                                                                    Uploaded
                                                                </Badge>
                                                            </Link>
                                                        ) : (
                                                            <Badge
                                                                className="text-xs"
                                                                variant="outline"
                                                            >
                                                                Missing
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell>
                                                <div className="font-medium">
                                                    No team data
                                                </div>
                                                <div className="hidden text-sm text-muted-foreground md:inline">
                                                    blaaaa
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
