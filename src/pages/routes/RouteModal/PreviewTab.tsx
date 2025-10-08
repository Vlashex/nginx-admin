import { useState } from "react";
import { Button } from "@/shared/ui-kit/button";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";

type Props = {
  preview: string;
};

export function PreviewTab({ preview }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    toast.success("Конфигурация скопирована");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4 text-sm text-gray-300 bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">
          Предпросмотр конфигурации
        </h3>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-gray-600 hover:bg-gray-800"
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              Скопировано
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Копировать
            </>
          )}
        </Button>
      </div>

      <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto text-gray-100 whitespace-pre-wrap leading-relaxed">
        {preview}
      </pre>
    </div>
  );
}
