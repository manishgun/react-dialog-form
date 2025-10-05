import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

/* ────────────────────────────────
   🔹 1. Define the schema system
──────────────────────────────── */
type FieldType = "text" | "number";

type FieldSchema = {
  label: string;
  required?: boolean;
  type: FieldType;
};

type Schema = Record<string, FieldSchema>;

/* 🔹 2. Infer the output value type based on schema */
type Values<T extends Schema> = {
  [K in keyof T]: T[K]["type"] extends "number"
    ? T[K]["required"] extends true
      ? number
      : number | undefined
    : T[K]["type"] extends "text"
    ? T[K]["required"] extends true
      ? string
      : string | undefined
    : unknown;
};

/* ────────────────────────────────
   🔹 3. Form props with inferred type
──────────────────────────────── */
type FormProps<T extends Schema> = {
  title?: string;
  description?: string;
  open?: boolean;
  close?: boolean;
  width?: number;
  minHeight?: number;
  onSubmit: (values: Values<T>) => void | Promise<void>;
  schema: T;
  onClose: () => void;
};

/* ────────────────────────────────
   🔹 4. Context Setup
──────────────────────────────── */
const FormContext = createContext<{
  open: <T extends Schema>(props: FormProps<T>) => number;
  close: (index: number) => void;
}>({
  open: () => 0,
  close: () => {}
});

/* ────────────────────────────────
   🔹 5. Helper for typed Object.entries
──────────────────────────────── */
function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/* ────────────────────────────────
   🔹 6. Provider Component
──────────────────────────────── */
export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<Record<number, FormProps<any>>>({});

  const formValues = useMemo(() => Object.entries(forms), [forms]);

  const open = <T extends Schema>(props: FormProps<T>) => {
    const id = Date.now();
    setForms(prev => ({ ...prev, [id]: props }));
    return id;
  };

  const close = (id: number) => {
    setForms(prev => {
      const updated = { ...prev };
      const onClose = updated[id].onClose;
      setTimeout(() => {
        onClose();
      }, 50);
      delete updated[id];
      return updated;
    });
  };

  return (
    <FormContext.Provider value={{ open, close }}>
      {formValues.map(([key, form]) => {
        const id = Number(key);
        return (
          <Dialog
            key={id}
            isOpen={true}
            onClose={
              form.close !== false
                ? () => {
                    close(id);
                  }
                : undefined
            }
          >
            {form.title && <h1 style={{ margin: 0 }}>{form.title}</h1>}
            {form.description && <p>{form.description}</p>}
          </Dialog>
        );
      })}
      {children}
    </FormContext.Provider>
  );
};

/* ────────────────────────────────
   🔹 7. useForm Hook (with inference)
──────────────────────────────── */
export const useForm = <T extends Schema>(schema: T, options: Omit<FormProps<T>, "schema" | "onClose">) => {
  const [remember, setRemember] = useState<{ id?: number; props?: FormProps<T> }>({});
  const { open, close } = useContext(FormContext);

  const utils = {
    open: () => {
      if (!remember.id) {
        const value = {
          ...options,
          schema,
          onClose: () => {
            setRemember({});
          }
        };
        const id = open(value);
        setRemember({ id, props: value });
      }
    },
    close: () => {
      if (remember.id && options.close !== false) {
        close(remember.id);
        setRemember({});
      }
    }
  };

  useEffect(() => {
    if (options.open && JSON.stringify(remember.props) !== JSON.stringify(options)) utils.open();
  }, []);

  return utils;
};

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
  minHeight?: number;
}

const Dialog = ({ isOpen, onClose, title, children, width = 1152, minHeight = 300 }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on "Escape" key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleClickOutside = (event: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClickOutside}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)",
        zIndex: 150,
        padding: "0 16px"
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width: width,
          minHeight: minHeight,
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          padding: "24px",
          position: "relative",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>{title}</div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "26px",
                cursor: "pointer",
                lineHeight: 1
              }}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};
