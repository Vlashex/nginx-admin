import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@vlashex/shared/src/ui-kit/form";
import { Input } from "@vlashex/shared/src/ui-kit/input";

type Props<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
};

export function AdvancedTab({ form }: Props) {
  // реактивное наблюдение
  const gzip = form.watch("advanced.gzip");
  const caching = form.watch("advanced.caching");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="advanced.client_max_body_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Максимальный размер тела запроса</FormLabel>
              <FormControl>
                <Input placeholder="1m" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="advanced.keepalive_timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Таймаут keepalive</FormLabel>
              <FormControl>
                <Input placeholder="65s" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* gzip */}
      <div className="flex flex-col space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded"
            checked={!!gzip}
            onChange={(e) => {
              const checked = e.target.checked;
              form.setValue("advanced.gzip", checked);
              if (!checked) form.setValue("advanced.gzip_types", undefined);
            }}
          />
          <span>Включить Gzip сжатие</span>
        </label>

        {gzip && (
          <FormField
            control={form.control}
            name="advanced.gzip_types"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Типы для Gzip</FormLabel>
                <FormControl>
                  <Input
                    placeholder="text/plain text/css application/json"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* caching */}
      <div className="flex flex-col space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded"
            checked={!!caching}
            onChange={(e) => {
              const checked = e.target.checked;
              form.setValue("advanced.caching", checked);
              if (!checked) form.setValue("advanced.cache_valid", undefined);
            }}
          />
          <span>Включить кэширование</span>
        </label>

        {caching && (
          <FormField
            control={form.control}
            name="advanced.cache_valid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Валидность кэша</FormLabel>
                <FormControl>
                  <Input placeholder="200 302 10m" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}
