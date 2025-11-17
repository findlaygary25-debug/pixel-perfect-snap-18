import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

interface Language {
  code: string;
  name: string;
  native_name: string;
  rtl: boolean;
}

interface LanguageManagerProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

export function LanguageManager({ selectedLanguage, onLanguageChange }: LanguageManagerProps) {
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    const { data, error } = await supabase
      .from("supported_languages")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setLanguages(data);
    }
  };

  const selectedLang = languages.find((l) => l.code === selectedLanguage);

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Language</Label>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.native_name}</span>
                    <span className="text-muted-foreground text-xs">({lang.name})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLang?.rtl && (
          <Badge variant="outline" className="w-full justify-center">
            Right-to-Left Language
          </Badge>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Create translations for each language to support international audiences.</p>
        </div>
      </CardContent>
    </>
  );
}
