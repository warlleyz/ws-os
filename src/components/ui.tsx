
import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    PropsWithChildren,
} from 'react'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
}

const buttonStyles = {
    primary:
        'border-transparent bg-ws-accent text-[var(--ws-accent-text)]',
    secondary:
        'border-ws-border bg-[var(--ws-surface-raised)] text-ws-text',
}

export function Button({
    variant = 'primary',
    className = '',
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={[
                'rounded-xl border px-4 py-2 font-semibold',
                'transition-opacity hover:opacity-85',
                'disabled:cursor-not-allowed disabled:opacity-40',
                buttonStyles[variant],
                className,
            ].join(' ')}
            {...props}
        />
    )
}

type CardProps = PropsWithChildren<{
    className?: string
}>

export function Card({
    children,
    className = '',
}: CardProps) {
    return (
        <section
            className={[
                'rounded-2xl border border-ws-border',
                'bg-ws-surface p-6',
                'shadow-[var(--ws-shadow)]',
                className,
            ].join(' ')}
        >
            {children}
        </section>
    )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string
}

export function TextField({
    label,
    id,
    className = '',
    ...props
}: TextFieldProps) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold"
            >
                {label}
            </label>

            <input
                id={id}
                className={[
                    'w-full rounded-xl border border-ws-border',
                    'bg-ws-bg px-4 py-3 text-ws-text',
                    'placeholder:text-ws-muted',
                    className,
                ].join(' ')}
                {...props}
            />
        </div>
    )
}
