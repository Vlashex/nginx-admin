export function PreviewTab({ preview }: { preview: string }) {
  return (
    <div>
      <h4 className="text-lg font-medium mb-2">Предпросмотр конфигурации</h4>
      <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
        {preview}
      </pre>
    </div>
  );
}
