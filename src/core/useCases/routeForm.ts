// core/useCases/routeForm.ts
import type { Route, LocationConfig, URLPath } from "@/core/entities/types";
import {
  validateDomain,
  validatePort,
  validateUnixPath,
  validateURLPath,
} from "@/core/utils/validators";

export const validateForm = (
  formData: Partial<Route>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.domain || !validateDomain(formData.domain)) {
    errors.domain = "Invalid domain format";
  }

  if (!formData.port || !validatePort(formData.port)) {
    errors.port = "Port must be between 1 and 65535";
  }

  if (!formData.root || !validateUnixPath(formData.root)) {
    errors.root = "Invalid path format";
  }

  return errors;
};

export const validateLocation = (
  location: Partial<LocationConfig>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!location.path || !validateURLPath(location.path)) {
    errors.path = "Invalid URL path format";
  }

  return errors;
};

export const createLocation = (
  locationData: Partial<LocationConfig>
): LocationConfig => {
  return {
    path: "/" as URLPath,
    ...locationData,
  } as LocationConfig;
};
