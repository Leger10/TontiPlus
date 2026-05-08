import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation.jsx";
import TontineCard from "@/components/TontineCard.jsx";
import { Search, MapPin, SlidersHorizontal, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "@/components/BackButton.jsx";

const TontinesBrowsePage = () => {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    const fetchTontines = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tontines")
          .select(
            `
            *,
            organisateur:organisateur_id(full_name, email),
            pays:pays(name)
          `,
          )
          .eq("statut", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTontines(data || []);
      } catch (error) {
        console.error("Error fetching tontines:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTontines();
  }, []);

  const filteredTontines = tontines.filter((tontine) => {
    const matchesSearch = tontine.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || tontine.type_tontine === typeFilter;
    const matchesLocation =
      !locationFilter ||
      (tontine.localisation &&
        tontine.localisation
          .toLowerCase()
          .includes(locationFilter.toLowerCase()));
    return matchesSearch && matchesType && matchesLocation;
  });

  return (
    <>
      <Helmet>
        <title>Explorer les tontines - BonPlan</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Sticky Header with Filters */}
        <div className="bg-card border-b border-white/60 sticky top-0 z-30 px-4 pt-6 pb-4 shadow-premium">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              <BackButton className="-ml-2" />
              <h1 className="text-2xl font-extrabold text-foreground">
                Découvrir
              </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border border-border shadow-inner rounded-xl text-foreground"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ville ou région..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10 bg-background border border-border shadow-inner rounded-xl text-foreground"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-background border border-border shadow-inner rounded-xl text-foreground">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-premium">
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="rotative">Tontine Rotative</SelectItem>
                  <SelectItem value="epargne">Épargne</SelectItem>
                  <SelectItem value="mixte">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-4 text-sm text-muted-foreground font-medium flex items-center">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {filteredTontines.length}{" "}
            {filteredTontines.length > 1
              ? "tontines trouvées"
              : "tontine trouvée"}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  className="h-[400px] w-full rounded-2xl shadow-premium"
                />
              ))}
            </div>
          ) : filteredTontines.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-white/60 shadow-premium">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">
                Aucune tontine trouvée
              </p>
              <p className="text-muted-foreground text-sm">
                Modifiez vos filtres ou créez une nouvelle tontine.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredTontines.map((tontine) => (
                  <motion.div
                    key={tontine.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TontineCard tontine={tontine} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default TontinesBrowsePage;
