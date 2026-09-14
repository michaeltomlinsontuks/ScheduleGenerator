<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/common
researched_at_commit: 6d2581df94e60485c5cb985b12e41a3fb38b13ba
sources:
  - path: frontend/src/components/common/Alert.tsx
    blob_sha: 45e80dc3ab6d067e3e24f205d8f1db604e7b5925
  - path: frontend/src/components/common/Button.tsx
    blob_sha: 5bdd051ef172f715e08776a06c6358c5363991f9
  - path: frontend/src/components/common/Card.tsx
    blob_sha: cbbb554d5121e77c823f62c7eac16034fefc795c
  - path: frontend/src/components/common/Loading.tsx
    blob_sha: 84f7e41162ca3f5c35594a745ad4ec853b661ea1
  - path: frontend/src/components/common/Modal.tsx
    blob_sha: 2a680719d31ca6d04866104433510d35e22e1740
  - path: frontend/src/components/common/index.ts
    blob_sha: 4fab4baba5649f0f980d81be939b4d00c28030f0
-->

# Research: frontend/src/components/common

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-common.d0e43f76`

Alert renders a dismissible status message: a div with role="alert" whose className combines the base 'alert' class with a type-specific class from typeClasses, containing the message text and, when onDismiss is provided, a ghost button with an X icon that invokes onDismiss.

- `frontend/src/components/common/Alert.tsx` L18-L47 @45e80dc3ab6d067e3e24f205d8f1db604e7b5925

### `research.frontend-src-components-common.50ccbeea`

AlertProps declares type as one of 'info' | 'success' | 'warning' | 'error', message as a required string, and onDismiss as an optional callback with no arguments.

- `frontend/src/components/common/Alert.tsx` L5-L9 @45e80dc3ab6d067e3e24f205d8f1db604e7b5925

### `research.frontend-src-components-common.1da5943e`

typeClasses maps each Alert type to a DaisyUI alert class: info to alert-info, success to alert-success, warning to alert-warning, and error to alert-error.

- `frontend/src/components/common/Alert.tsx` L11-L16 @45e80dc3ab6d067e3e24f205d8f1db604e7b5925

### `research.frontend-src-components-common.80dbf7cf`

Button renders a native button element whose className is built from the base 'btn' class, the variant class, the size class, and any caller-supplied className joined with spaces; the button is disabled when either disabled or loading is true, and a spinner span is rendered before the children when loading is true.

- `frontend/src/components/common/Button.tsx` L25-L51 @5bdd051ef172f715e08776a06c6358c5363991f9

### `research.frontend-src-components-common.8fc44071`

ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> and adds variant ('primary' | 'secondary' | 'ghost' | 'outline'), size ('sm' | 'md' | 'lg'), loading (boolean), and children (React.ReactNode).

- `frontend/src/components/common/Button.tsx` L5-L10 @5bdd051ef172f715e08776a06c6358c5363991f9

### `research.frontend-src-components-common.206ce3a0`

variantClasses maps each Button variant to a DaisyUI class (primary to btn-primary, secondary to btn-secondary, ghost to btn-ghost, outline to btn-outline) and sizeClasses maps each size (sm to btn-sm, md to btn-md, lg to btn-lg); Button defaults variant to 'primary', size to 'md', and loading to false.

- `frontend/src/components/common/Button.tsx` L12-L23 @5bdd051ef172f715e08776a06c6358c5363991f9
- `frontend/src/components/common/Button.tsx` L25-L33 @5bdd051ef172f715e08776a06c6358c5363991f9

### `research.frontend-src-components-common.513b77f1`

Card renders a div with the classes 'card' and 'bg-base-100', adding 'card-border' when bordered is true and any caller-supplied className, and wraps its children in a 'card-body' div.

- `frontend/src/components/common/Card.tsx` L11-L26 @cbbb554d5121e77c823f62c7eac16034fefc795c

### `research.frontend-src-components-common.8146bcfd`

CardProps declares children as a required React.ReactNode, bordered as an optional boolean that defaults to false, and className as an optional string that defaults to an empty string.

- `frontend/src/components/common/Card.tsx` L5-L9 @cbbb554d5121e77c823f62c7eac16034fefc795c

### `research.frontend-src-components-common.f9bbb9f7`

Loading renders a flex container with a spinner span carrying the 'loading loading-spinner' classes plus a size class (defaulting to 'md'), and an optional text span rendered when text is provided.

- `frontend/src/components/common/Loading.tsx` L16-L23 @84f7e41162ca3f5c35594a745ad4ec853b661ea1

### `research.frontend-src-components-common.836f7ded`

LoadingProps declares size as an optional 'sm' | 'md' | 'lg' that defaults to 'md' and text as an optional string; sizeClasses maps each size to loading-sm, loading-md, and loading-lg respectively.

- `frontend/src/components/common/Loading.tsx` L5-L14 @84f7e41162ca3f5c35594a745ad4ec853b661ea1

### `research.frontend-src-components-common.a2a4d929`

Modal renders a native <dialog> element with the class 'modal'; a useEffect calls showModal() when isOpen becomes true and close() when it becomes false, and onClose is invoked both from the dialog's onClose event and when a click on the dialog element itself (the backdrop) is detected.

- `frontend/src/components/common/Modal.tsx` L12-L38 @2a680719d31ca6d04866104433510d35e22e1740

### `research.frontend-src-components-common.67d14761`

Modal renders a 'modal-box' div containing an optional title heading, a circular ghost close button labelled 'Close modal' that invokes onClose, and the children, followed by a 'modal-backdrop' form whose close button also invokes onClose.

- `frontend/src/components/common/Modal.tsx` L40-L55 @2a680719d31ca6d04866104433510d35e22e1740

### `research.frontend-src-components-common.3a868828`

ModalProps declares isOpen (boolean), onClose (callback with no arguments), an optional title (string), and children (React.ReactNode).

- `frontend/src/components/common/Modal.tsx` L5-L10 @2a680719d31ca6d04866104433510d35e22e1740

### `research.frontend-src-components-common.4c93d27b`

index.ts is a barrel module that re-exports the Button, Alert, Loading, Card, and Modal components together with their prop types (ButtonProps, AlertProps, LoadingProps, CardProps, ModalProps).

- `frontend/src/components/common/index.ts` L1-L15 @4fab4baba5649f0f980d81be939b4d00c28030f0

### `research.frontend-src-components-common.71789013`

All five components in this unit (Alert, Button, Card, Loading, Modal) are client components, each file beginning with the 'use client' directive.

- `frontend/src/components/common/Alert.tsx` L1-L1 @45e80dc3ab6d067e3e24f205d8f1db604e7b5925
- `frontend/src/components/common/Button.tsx` L1-L1 @5bdd051ef172f715e08776a06c6358c5363991f9
- `frontend/src/components/common/Card.tsx` L1-L1 @cbbb554d5121e77c823f62c7eac16034fefc795c
- `frontend/src/components/common/Loading.tsx` L1-L1 @84f7e41162ca3f5c35594a745ad4ec853b661ea1
- `frontend/src/components/common/Modal.tsx` L1-L1 @2a680719d31ca6d04866104433510d35e22e1740

## Open questions

None.
