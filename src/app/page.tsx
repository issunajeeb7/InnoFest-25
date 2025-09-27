"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { IconSquareRoundedPlus, IconNumber } from "@tabler/icons-react";
import { useSession } from "@/context/SessionContext";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

type FormattedItem = {
    id: string | number;
    title: string;
    description: string;
    header: React.ReactNode;
    icon: React.ReactNode;
    teamId?: string | number;
    ps_number: number;
    waiting_list?: boolean;
};

const confirmButton: FormattedItem = {
    id: "confirm-button",
    title: "Add your team now",
    description:
        "Click here to add your team details and showcase them on our main page",
    header: (
        <div className="w-full h-36 bg-blue-200 flex items-center justify-center rounded-xl">
            <IconSquareRoundedPlus size={48} />
        </div>
    ),
    icon: <IconSquareRoundedPlus />,
    teamId: "fixed-item",
    ps_number: 0,
};

const Skeleton = () => (
    <div className="flex flex-1 w-full h-full min-h-36 rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

const createPlaceholderItem = (index: number): FormattedItem => ({
    id: "",
    title: `Slot for team ${index}`,
    description: "This slot is yet to be filled",
    header: <Skeleton />,
    icon: <IconNumber className="h-6 w-6 text-neutral-500" />,
    teamId: `placeholder-${index}`,
    ps_number: index,
});

export default function Page() {
    const [items, setItems] = useState<FormattedItem[]>([
        confirmButton,
        ...Array(36)
            .fill(null)
            .map((_, index) => createPlaceholderItem(index + 1)),
    ]);
    const [userHasTeam, setUserHasTeam] = useState<boolean>(false);
    const supabase = createClient();
    const { session, loading } = useSession();

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from("teams")
                    .select(
                        "id, team_name, problem_statement_number, problem_statement_title, group_photo_url, user_id, waiting_list"
                    );

                if (error) throw error;

                // Check if the current user has a team
                if (session?.user?.id) {
                    const userTeam = data.find((team: any) => team.user_id === session.user.id);
                    setUserHasTeam(!!userTeam);
                }

                updateItemsWithTeamData(data);
            } catch (error) {
                console.error("Error fetching team details:", error);
            }
        };

        const updateItemsWithTeamData = (data: any[]) => {
            // Separate regular teams from waiting list teams
            const regularTeams = data.filter(team => !team.waiting_list);
            const waitingListTeams = data.filter(team => team.waiting_list);

            const formatTeam = (team: any): FormattedItem => ({
                id: team.id,
                title: team.team_name,
                description: `Solving: ${team.problem_statement_title}`,
                header: team.group_photo_url ? (
                    <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/group-photos/${team.group_photo_url}`}
                        alt={team.team_name}
                        width={200}
                        height={200}
                        className="w-full h-36 rounded-md object-cover"
                    />
                ) : (
                    <Image
                        src={"/jeremy-perkins-uhjiu8FjnsQ-unsplash.jpg"}
                        alt={team.team_name}
                        width={100}
                        height={100}
                        className="w-full h-36 rounded-md object-cover"
                    />
                ),
                icon: <IconNumber className="h-6 w-6 text-neutral-500" />,
                teamId: team.user_id,
                ps_number: team.problem_statement_number,
                waiting_list: team.waiting_list,
            });

            const formattedRegularTeams = regularTeams.map(formatTeam);
            const formattedWaitingListTeams = waitingListTeams.map(formatTeam);

            // Calculate placeholders: only show up to 35 regular slots
            // If we have waiting list teams, placeholders fill only up to slot 35
            const maxRegularSlots = 35;
            const placeholderCount = formattedWaitingListTeams.length > 0 
                ? Math.max(0, maxRegularSlots - formattedRegularTeams.length) // Stop at 35 if waiting list exists
                : Math.max(0, 36 - formattedRegularTeams.length); // Go up to 36 if no waiting list

            const updatedItems = [
                confirmButton,
                ...formattedRegularTeams,
                ...Array(placeholderCount)
                    .fill(null)
                    .map((_, index) =>
                        createPlaceholderItem(formattedRegularTeams.length + index + 1)
                    ),
                ...formattedWaitingListTeams, // Waiting list teams start from slot 36 onwards
            ];

            setItems(updatedItems);
        };

        fetchTeamDetails();

        const subscription = supabase
            .channel("teams_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "teams" },
                (payload: any) => {
                    // console.log("Change received!", payload);
                    fetchTeamDetails();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, session?.user?.id]);

    return (
        <main>
            <header className="bg-white">
                <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
                    <Link
                        className="text-gray-600 flex items-center space-x-4"
                        href="/"
                    >
                        <span className="sr-only">Home</span>
                        <svg
                            className="h-8 sm:h-10"
                            viewBox="0 0 51 50"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M50.0954 3.0813C50.0921 2.93266 50.0865 2.78403 50.081 2.63483C50.0748 2.46838 50.0698 2.30249 50.0609 2.13548C50.0437 1.80035 50.022 1.46355 49.9936 1.12563C49.9485 0.583972 49.5181 0.154204 48.9765 0.108555C48.6386 0.0801639 48.3029 0.0590095 47.9683 0.0411953C47.7985 0.0322882 47.6304 0.027278 47.4623 0.0211544C47.3164 0.0161441 47.17 0.0100205 47.0247 0.00723702C46.7814 0.00167008 46.5398 0 46.2988 0C46.2587 0 46.2181 1.10173e-09 46.178 0.000556695C41.3748 0.0239378 36.9658 1.20302 32.5145 3.63354C32.436 3.67696 32.3575 3.7176 32.279 3.76047C32.2512 3.77605 32.2239 3.78941 32.1961 3.805C32.1899 3.80834 32.1849 3.81391 32.1788 3.81725C28.5291 5.85141 24.8856 8.72228 21.1145 12.4933C20.6859 12.922 20.2667 13.3562 19.8519 13.7926L12.5236 14.3499C12.3093 14.366 12.1044 14.444 11.9335 14.5737L0.439474 23.321C0.0737261 23.5994 -0.0838183 24.0737 0.0436646 24.5151C0.170591 24.9566 0.555823 25.2744 1.01342 25.3162L11.7983 26.2899L15.213 29.7046C14.0028 29.9813 12.7697 30.6593 11.7136 31.7148C11.0812 32.3478 10.5735 33.057 10.2017 33.8319C9.71566 34.8613 8.64848 37.5117 7.51839 40.318L6.96671 41.6869C6.7997 42.1011 6.89601 42.5748 7.21221 42.8905C7.42487 43.1037 7.70989 43.2167 7.99993 43.2167C8.13966 43.2167 8.28106 43.19 8.41634 43.1354L9.83424 42.5637C12.6177 41.4425 15.247 40.3831 16.2785 39.8971C17.0468 39.5275 17.7565 39.0198 18.3884 38.3879C19.4439 37.3324 20.1214 36.0994 20.3981 34.8891L23.7115 38.2025L24.6852 48.9868C24.7263 49.4444 25.0448 49.8297 25.4862 49.9566C25.5881 49.9861 25.6917 50 25.7941 50C26.1359 50 26.466 49.8425 26.6803 49.5608L35.4266 38.0673C35.5563 37.8964 35.6342 37.6915 35.6503 37.4772L36.1909 30.3654C36.668 29.9139 37.1406 29.4552 37.6088 28.9876C41.3826 25.2138 44.2552 21.5685 46.2899 17.9166C46.2921 17.9127 46.2954 17.9094 46.2977 17.9055C46.3077 17.8877 46.316 17.8704 46.3261 17.8526C46.419 17.685 46.5075 17.5175 46.5966 17.3494C48.9386 12.981 50.0765 8.64545 50.101 3.9336C50.1016 3.88739 50.1016 3.84174 50.1016 3.79554C50.1027 3.55894 50.101 3.32068 50.0954 3.0813ZM35.8608 20.8192C34.9829 21.6971 33.8149 22.1815 32.5724 22.1815C31.3304 22.1815 30.1625 21.6977 29.284 20.8192C27.4708 19.0055 27.4708 16.0556 29.284 14.2419C31.0983 12.4287 34.0487 12.4299 35.8608 14.2419C36.7392 15.1198 37.2236 16.2877 37.2236 17.5303C37.2236 18.7728 36.7398 19.9408 35.8608 20.8192Z"
                                fill="currentColor"
                            />
                        </svg>
                        <div className="text-3xl font-bold hidden md:block">
                            <span className="font-normal">DUK</span>
                            InnoFest&apos;25
                        </div>
                        <div className="text-xl font-bold md:hidden">
                            <span className="font-normal">DUK</span>
                            InnoFest&apos;25
                        </div>
                    </Link>

                    <div className="flex flex-1 items-center justify-end md:justify-end">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex sm:gap-4">
                                {session ? (
                                    <>
                                        <Link
                                            className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                            href="/profile"
                                        >
                                            My Team
                                        </Link>
                                        <Link
                                            className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                            href="/logout"
                                        >
                                            Logout
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                            href="/login"
                                        >
                                            Login
                                        </Link>

                                        <Link
                                            className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:text-gray-600/75 sm:block"
                                            href="/signup"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </div>

                            <Sheet>
                                <SheetTrigger className="md:hidden">
                                    <span className="sr-only">Toggle menu</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="size-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Menu</SheetTitle>
                                        <SheetDescription className="flex flex-col space-y-4">
                                            {session ? (
                                                <>
                                                    <Link
                                                        className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                                        href="/profile"
                                                    >
                                                        My Team
                                                    </Link>
                                                    <Link
                                                        className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                        href="/logout"
                                                    >
                                                        Logout
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                        href="/login"
                                                    >
                                                        Login
                                                    </Link>

                                                    <Link
                                                        className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:text-gray-600/75 sm:block"
                                                        href="/signup"
                                                    >
                                                        Register
                                                    </Link>
                                                </>
                                            )}
                                        </SheetDescription>
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>
            <div className="max-w-4xl px-6 lg:px-0 mx-auto pt-12 font-bold text-3xl text-gray-800">
                Smart India Internal Hackathon Teams
            </div>
            <BentoGrid className="max-w-4xl mx-auto py-12 px-4 lg:px-0">
                {items.map((item, i) =>
                    i === 0 ? (
                        session ? (
                            <Link href={userHasTeam ? "/profile" : "/confirm"} key={i}>
                                <BentoGridItem
                                    title={userHasTeam ? "View your team" : item.title}
                                    description={userHasTeam ? "Click here to view and manage your team details" : item.description}
                                    header={item.header}
                                    icon={item.icon}
                                    className="cursor-pointer"
                                />
                            </Link>
                        ) : (
                            <Link href={"/signup"} key={i}>
                                <BentoGridItem
                                    title={item.title}
                                    description={item.description}
                                    header={item.header}
                                    icon={item.icon}
                                    className="cursor-pointer"
                                />
                            </Link>
                        )
                    ) : (
                        <Link href={`/team/${item.id}`} key={i}>
                            <BentoGridItem
                                key={i}
                                title={item.title}
                                description={item.description}
                                header={item.header}
                                icon={item.icon}
                                ps_number={item.ps_number}
                                waiting_list={item.waiting_list}
                            />
                        </Link>
                    )
                )}
            </BentoGrid>
            <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        About the Organizers
                    </h2>

                    <p className="mt-4 text-gray-500 sm:text-xl">
                        DUK<span className="font-bold">InnoFest</span>&apos;25
                        is a collaborative effort by Digital University Kerala,
                        Institution&apos;s Innovation Council - DUK and the
                        Innovation Club of DUK. This screening event aims to
                        identify and nurture talented innovators who will go on
                        to represent our institution at the prestigious
                        national-level Smart India Hackathon.
                    </p>
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col my-auto gap-4 items-center rounded-lg border border-gray-100 px-4 py-8 text-center">
                        <dt className="order-last text-lg font-medium text-gray-500">
                            <Label>Digital University Kerala</Label>
                        </dt>

                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            <Image
                                src={"/DUK Logo.png"}
                                alt="Organizer Logo"
                                width={100}
                                height={100}
                                className=""
                            ></Image>
                        </dd>
                    </div>

                    <div className="flex flex-col my-auto gap-4 items-center rounded-lg border border-gray-100 px-4 py-8 text-center">
                        <dt className="order-last text-lg font-medium text-gray-500">
                            <Label>IIC DUK</Label>
                        </dt>

                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            <Image
                                src={"/PngItem_2459619.png"}
                                alt="Organizer Logo"
                                width={100}
                                height={100}
                                className=""
                            ></Image>
                        </dd>
                    </div>

                    <div className="flex flex-col my-auto gap-4 items-center rounded-lg border border-gray-100 px-4 py-8 text-center">
                        <dt className="order-last text-lg font-medium text-gray-500">
                            <Label>Innovation Club DUK</Label>
                        </dt>

                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            <Image
                                src={"/IC Logo.png"}
                                alt="Organizer Logo"
                                width={80}
                                height={80}
                                className=""
                            ></Image>
                        </dd>
                    </div>

                    <div className="flex flex-col my-auto gap-4 items-center rounded-lg border border-gray-100 px-4 py-8 text-center">
                        <dt className="order-last text-lg font-medium text-gray-500">
                            <Label>Smart India Hackathon 2025</Label>
                        </dt>

                        <dd className="text-4xl font-extrabold text-blue-600 md:text-5xl">
                            <Image
                                src={"/SIH_logo_2025_horizontal.png"}
                                alt="Organizer Logo"
                                width={100}
                                height={100}
                                className=""
                            ></Image>
                        </dd>
                    </div>
                </dl>
            </div>
        </main>
    );
}
