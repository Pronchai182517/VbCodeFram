"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Car,
  DoorOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { Button } from "@/components/ui/button";
import type { ResourceDto, CalendarEventDto } from "@/features/booking/server";

interface Props {
  resources: ResourceDto[];
  events: CalendarEventDto[];
}

export function BookingCalendarClient({ resources, events }: Props) {
  const t = useT();
  const locale = useLocale();

  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchType = selectedType === "ALL" || r.type === selectedType;
      if (!matchType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inName =
        r.nameTh.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q);
      const inLoc =
        (r.locationTh?.toLowerCase().includes(q) ?? false) ||
        (r.locationEn?.toLowerCase().includes(q) ?? false);
      const inFac = r.facilities.some((f) => f.toLowerCase().includes(q));

      return inName || inLoc || inFac;
    });
  }, [resources, selectedType, searchQuery]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchType = selectedType === "ALL" || ev.resourceType === selectedType;
      if (!matchType) return false;

      if (dateFilter) {
        const evDate = new Date(ev.start).toISOString().split("T")[0];
        if (evDate !== dateFilter) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.resourceName.toLowerCase().includes(q) ||
        ev.bookerName.toLowerCase().includes(q)
      );
    });
  }, [events, selectedType, dateFilter, searchQuery]);

  const roomCount = resources.filter((r) => r.type === "ROOM").length;
  const vehicleCount = resources.filter((r) => r.type === "VEHICLE").length;

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const datePart = start.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const startTime = start.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { datePart, timePart: `${startTime} - ${endTime}` };
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("booking.nav")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {t("booking.portal.title")}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          {t("booking.portal.subtitle")}
        </p>

        <div className="pt-2 flex justify-center gap-3">
          <Button asChild size="lg" className="gap-2 shadow-sm">
            <Link href="/admin/bookings">
              {t("booking.newBooking")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <DoorOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{roomCount}</div>
            <div className="text-sm text-muted-foreground">{t("booking.type.ROOM")}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{vehicleCount}</div>
            <div className="text-sm text-muted-foreground">{t("booking.type.VEHICLE")}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-sm text-muted-foreground">{t("booking.tab.reservations")}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("ALL")}
            >
              {t("booking.type.all")}
            </Button>
            <Button
              variant={selectedType === "ROOM" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setSelectedType("ROOM")}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              {t("booking.type.ROOM")}
            </Button>
            <Button
              variant={selectedType === "VEHICLE" ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setSelectedType("VEHICLE")}
            >
              <Car className="h-3.5 w-3.5" />
              {t("booking.type.VEHICLE")}
            </Button>
          </div>

          {/* Date filter & Search input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              aria-label={t("booking.portal.filterDate")}
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 border border-border/60 rounded-lg text-sm bg-background"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter("")}
                className="text-xs"
              >
                ล้างวันที่
              </Button>
            )}
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาชื่อห้อง, ยานพาหนะ, กิจกรรม..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-border/60 rounded-lg text-sm bg-background placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Reservations Timeline & Available Resources */}
      <div className="space-y-8">
        {/* Section 1: Upcoming Reservations Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              ตารางเวลาการใช้งานตามช่วงเวลา ({filteredEvents.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {t("booking.portal.availableNotice")}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 py-12 text-center bg-card/40 space-y-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">
                {t("booking.empty.reservations")}
              </p>
              <p className="text-xs text-muted-foreground">
                ไม่พบรายการจองในช่วงเวลาหรือเงื่อนไขที่คุณเลือก
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const { datePart, timePart } = formatDateRange(ev.start, ev.end);
                const isRoom = ev.resourceType === "ROOM";
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-border/60 bg-card hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className={`h-1.5 w-full ${
                        ev.status === "CONFIRMED" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium flex items-center ${
                            isRoom
                              ? "bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800"
                              : "bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {isRoom ? (
                            <DoorOpen className="h-3 w-3 mr-1 inline" />
                          ) : (
                            <Car className="h-3 w-3 mr-1 inline" />
                          )}
                          {isRoom ? t("booking.type.ROOM") : t("booking.type.VEHICLE")}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                            ev.status === "CONFIRMED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {t(`booking.status.${ev.status}`)}
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-bold line-clamp-1">
                          {ev.title}
                        </div>
                        <div className="text-xs font-medium text-foreground/80 mt-0.5">
                          {ev.resourceName}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{datePart}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{timePart}</span>
                        </div>
                        {ev.bookerName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span>ผู้จอง: {ev.bookerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Resource Inventory & Specs */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ห้องประชุมและยานพาหนะทั้งหมด ({filteredResources.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => {
              const isRoom = res.type === "ROOM";
              return (
                <div
                  key={res.id}
                  className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 bg-muted rounded border border-border/60">
                            {res.code}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              res.isActive
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {res.isActive
                              ? t("booking.resource.active")
                              : t("booking.resource.inactive")}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {locale === "th" ? res.nameTh : res.nameEn || res.nameTh}
                        </div>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl ${
                          isRoom
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {isRoom ? (
                          <DoorOpen className="h-5 w-5" />
                        ) : (
                          <Car className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>ความจุ {res.capacity} ที่นั่ง</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">
                          {locale === "th"
                            ? res.locationTh || "-"
                            : res.locationEn || res.locationTh || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Facilities / Driver tags */}
                    {res.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {res.facilities.map((fac, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-medium"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    )}

                    {res.driverName && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>พนักงานขับรถ: {res.driverName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Link href="/admin/bookings">
                        {t("booking.newBooking")}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
