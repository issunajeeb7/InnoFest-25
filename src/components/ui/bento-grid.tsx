import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    ps_number,
    waiting_list,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    ps_number?: number;
    waiting_list?: boolean;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-black/[0.2] justify-between flex flex-col space-y-4 h-full relative",
                className
            )}
        >
            {waiting_list && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full border border-yellow-500 z-10 font-semibold shadow-sm">
                    Waiting List
                </div>
            )}
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                <div className="flex items-center space-x-2">
                    {icon}
                    <p className="text-sm">{ps_number}</p>
                </div>
                <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300 line-clamp-2">
                    {description}
                </div>
            </div>
        </div>
    );
};
