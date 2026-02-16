import { toast } from "sonner";

export function errorToast(message: string) {
  toast.error(message, {
    duration: 5000,
  });
}

export function successToast(message: string) {
  toast.success(message, {
    duration: 3000,
  });
}

export function infoToast(message: string) {
  toast.info(message, {
    duration: 4000,
  });
}
