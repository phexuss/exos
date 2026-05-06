"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

interface SourceCardProps {
	source: "deezer" | "soundcloud";
}

export default function SourceCard({ source }: SourceCardProps) {
	const t = useTranslations("Sources");

	const tag = t(`${source}.tag`);

	const advantages = Object.values(
		t.raw(`${source}.advantages`) as Record<string, string>,
	);

	const rawDisadvantages = t.raw(`${source}.disadvantages`);
	const disadvantages = rawDisadvantages
		? Object.values(rawDisadvantages as Record<string, string>)
		: [];

	const isDeezer = source === "deezer";

	return (
		<article
			className={`
        group relative h-full overflow-hidden flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#161616]/80 backdrop-blur-md px-5 py-5 sm:px-7 sm:py-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${
					isDeezer
						? "hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.25)]"
						: "hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.25)]"
				}`}
		>
			<div
				className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-500 ${
					isDeezer
						? "bg-indigo-500/40 group-hover:bg-indigo-400/90"
						: "bg-orange-500/40 group-hover:bg-orange-400/90"
				}`}
			/>
			<div
				className={`absolute top-0 left-4 right-4 h-0.75 blur-[6px] transition-all duration-500 opacity-30 group-hover:opacity-70 ${
					isDeezer ? "bg-indigo-500" : "bg-orange-500"
				}`}
			/>

			<div className='relative z-10 flex flex-col h-full'>
				<div className='flex items-center justify-between mb-6'>
					<div
						className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.15em] uppercase backdrop-blur-xl transition-all duration-500 ${
							isDeezer
								? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]"
								: "border-orange-500/30 bg-orange-500/10 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_15px_rgba(249,115,22,0.25)]"
						}`}
					>
						{tag}
					</div>

					<Image
						src={`/${source}.svg`}
						alt={`${source} logo`}
						width={26}
						height={26}
						className={`transition-all duration-500 opacity-80 group-hover:opacity-100 group-hover:scale-105 ${
							isDeezer
								? "group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
								: "group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]"
						}`}
					/>
				</div>

				<h3 className='text-xl font-bold text-white tracking-tight mb-5'>
					{t(`${source}.title`)}
				</h3>

				<div className='grow flex flex-col gap-3'>
					<ul className='space-y-3 leading-relaxed'>
						{advantages.map(advantage => (
							<li
								key={advantage}
								className='text-white/90 text-sm flex items-start gap-3'
							>
								<span
									className={`mt-0.75 text-[10px] ${
										isDeezer ? "text-indigo-400" : "text-orange-500"
									}`}
								>
									✦
								</span>
								{advantage}
							</li>
						))}
					</ul>

					{disadvantages.length > 0 && (
						<ul className='space-y-3 leading-relaxed mt-1'>
							{disadvantages.map(disadvantage => (
								<li
									key={disadvantage}
									className='text-white/40 text-sm flex items-start gap-3 transition-colors duration-300 group-hover:text-white/50'
								>
									<span className='mt-0.5 text-xs text-white/20 font-bold'>
										—
									</span>
									{disadvantage}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</article>
	);
}
