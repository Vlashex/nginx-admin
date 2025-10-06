import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/ui-kit/form";
import { Input } from "@/shared/ui-kit/input";

type Props = { form: UseFormReturn<any> };

export function AdvancedTab({ form }: Props) {
  return (
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

      <label className="flex items-center">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 rounded"
          checked={!!form.watch("advanced.gzip")}
          onChange={(e) => form.setValue("advanced.gzip", e.target.checked)}
        />
        <span className="ml-2">Включить Gzip сжатие</span>
      </label>

      <FormField
        control={form.control}
        name="advanced.gzip_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gzip типы</FormLabel>
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

      <label className="flex items-center">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 rounded"
          checked={!!form.watch("advanced.caching")}
          onChange={(e) => form.setValue("advanced.caching", e.target.checked)}
        />
        <span className="ml-2">Включить кэширование</span>
      </label>

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
    </div>
  );
}
