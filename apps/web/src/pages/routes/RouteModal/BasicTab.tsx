import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@vlashex/shared/src/ui-kit/form";
import { Input } from "@vlashex/shared/src/ui-kit/input";
import type { UseFormReturn } from "react-hook-form";
import { PortSchema } from "@vlashex/core/entities/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = { form: UseFormReturn<any> };

export function BasicTab({ form }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Домен</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Порт</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={PortSchema.parse(field.value)}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="root"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Корневая директория</FormLabel>
              <FormControl>
                <Input placeholder="/var/www/html" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proxy_pass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Прокси-адрес (опционально)</FormLabel>
              <FormControl>
                <Input placeholder="http://localhost:3000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center space-x-4 mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded"
            checked={form.watch("enabled")}
            onChange={(e) => form.setValue("enabled", e.target.checked)}
          />
          <span className="ml-2">Маршрут активен</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded"
            checked={form.watch("ssl")}
            onChange={(e) => form.setValue("ssl", e.target.checked)}
          />
          <span className="ml-2">Включить SSL</span>
        </label>
      </div>

      {form.watch("ssl") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name="ssl_certificate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSL сертификат</FormLabel>
                <FormControl>
                  <Input placeholder="/etc/ssl/certs/domain.crt" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ssl_certificate_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSL ключ</FormLabel>
                <FormControl>
                  <Input placeholder="/etc/ssl/private/domain.key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
}
