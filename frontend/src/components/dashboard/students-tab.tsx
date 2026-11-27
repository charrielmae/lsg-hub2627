"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchStudentsMasterlistApi,
  Program,
  StudentsListResponse,
} from "@/lib/auth-api";

const PROGRAM_CARDS: Array<{
  code: Program;
  title: string;
  orgName: string;
}> = [
  {
    code: "BSIT",
    title: "BS Information Technology",
    orgName: "Society of Information Technology Students",
  },
  {
    code: "BSIS",
    title: "BS Information Systems",
    orgName: "Information System Students",
  },
  {
    code: "BSCS",
    title: "BS Computer Science",
    orgName: "Computer Science Students",
  },
];

export function StudentsTab() {
  const [program, setProgram] = React.useState<string>("ALL");
  const [year, setYear] = React.useState<string>("ALL");
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [data, setData] = React.useState<StudentsListResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchStudentsMasterlistApi({
      program,
      year,
      search: debouncedSearch,
      page,
      limit: 25,
    })
      .then((res) => {
        if (mounted) setData(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [program, year, debouncedSearch, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            CCIS Enrolled Students Roster
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Official `students` database table designated by academic program (`BSIT`, `BSIS`, `BSCS`) and student organization.
          </p>
        </div>
        <Badge variant="default">
          {data?.counts.total?.toLocaleString() || "1,817"} Total Students
        </Badge>
      </div>

      {/* Program Designation Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PROGRAM_CARDS.map((card) => {
          const isSelected = program === card.code;
          const count = data?.counts[card.code] ?? 0;
          return (
            <Card
              key={card.code}
              onClick={() => {
                setProgram(isSelected ? "ALL" : card.code);
                setPage(1);
              }}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-ccis-orange bg-ccis-primary/35 shadow-md"
                  : "bg-ccis-paper hover:border-ccis-orange/60"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={isSelected ? "orange" : "cream"}>
                    {card.code}
                  </Badge>
                  <GraduationCap className="h-4 w-4 text-ccis-orange" />
                </div>
                <CardTitle className="pt-1 text-2xl">
                  {count.toLocaleString()} Students
                </CardTitle>
                <CardDescription className="font-headline text-xs text-ccis-espresso/85">
                  {card.orgName}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-ccis-paper">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ccis-espresso/60" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Student ID (e.g. 261-01458) or Student Name..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "BSIT", "BSIS", "BSCS"] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={program === p ? "brand" : "outline"}
                  onClick={() => {
                    setProgram(p);
                    setPage(1);
                  }}
                >
                  {p === "ALL" ? "All Programs" : p}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {(["ALL", "1st", "2nd", "3rd", "4th"] as const).map((yr) => (
                <Button
                  key={yr}
                  type="button"
                  size="sm"
                  variant={year === yr ? "secondary" : "ghost"}
                  className="h-8 px-2.5 text-xs"
                  onClick={() => {
                    setYear(yr);
                    setPage(1);
                  }}
                >
                  {yr === "ALL" ? "All Yrs" : `${yr} Yr`}
                </Button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto rounded-lg border border-ccis-ink/15 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ccis-ink/15 bg-ccis-cream/65 font-subtext text-[11px] uppercase tracking-wider text-ccis-espresso">
                <tr>
                  <th className="px-4 py-2.5">ID Number</th>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Program</th>
                  <th className="px-4 py-2.5">Year</th>
                  <th className="px-4 py-2.5">Designated Organization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ccis-ink/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-ccis-orange" />
                    </td>
                  </tr>
                ) : !data || data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center font-headline text-xs text-ccis-espresso/75"
                    >
                      No student records match your current search/filter.
                    </td>
                  </tr>
                ) : (
                  data.items.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-ccis-cream/30"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-subtext text-xs font-medium text-ccis-ink">
                        {student.student_no}
                      </td>
                      <td className="px-4 py-2.5 font-headline font-medium text-ccis-ink">
                        {student.full_name}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            student.program === "BSIT"
                              ? "default"
                              : student.program === "BSIS"
                                ? "cream"
                                : "orange"
                          }
                        >
                          {student.program}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-subtext text-xs text-ccis-espresso">
                        {student.year_level} Year
                      </td>
                      <td className="px-4 py-2.5 font-headline text-xs text-ccis-espresso">
                        {student.organizationName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="font-subtext text-xs text-ccis-espresso/80">
                Showing {data.items.length} of{" "}
                {data.totalFiltered.toLocaleString()} matching students (Page{" "}
                {data.page} of {data.totalPages})
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages || loading}
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
