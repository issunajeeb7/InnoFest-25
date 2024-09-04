import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="mx-auto flex max-w-screen-xl justify-center lg:h-screen py-12 items-center gap-8 px-4 sm:px-6 lg:px-8">
            <Card className="">
                <CardHeader>
                    <CardTitle>Please confirm your email address</CardTitle>
                    <CardDescription>Thanks for signing up!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Please check your email for an account confirmation
                        link.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                    <p>
                        Didn&apos;t get any email?{" "}
                        <Link
                            className="text-teal-500"
                            href={"tel:+9199447189437"}
                        >
                            Let us help you
                        </Link>
                    </p>
                    <p>
                        <Link href={"/"}>
                            <Button>Back to Home</Button>
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
