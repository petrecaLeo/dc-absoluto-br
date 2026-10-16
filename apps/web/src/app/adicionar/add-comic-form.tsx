"use client"

import { COMIC_UNIVERSE_LABELS, type Character } from "@dc-absoluto/shared-types"
import Link from "next/link"
import { type InputHTMLAttributes, type ReactNode, useId } from "react"

import { Button } from "@/components/button"
import { type AddComicField, useAddComicForm } from "./add-comic-form.hook"

const UNIVERSE_SUGGESTIONS = Object.keys(COMIC_UNIVERSE_LABELS)

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-dc-blue focus:ring-2 focus:ring-dc-blue/40"

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string
  field: AddComicField
  value: string
  onValueChange: (field: AddComicField, value: string) => void
  hint?: ReactNode
}

function Field({ label, field, value, onValueChange, hint, required, ...inputProps }: FieldProps) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-white/80">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-dc-gold">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={field}
        value={value}
        required={required}
        onChange={(event) => onValueChange(field, event.target.value)}
        className={fieldClassName}
        {...inputProps}
      />
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  )
}

interface AddComicFormProps {
  characters: Character[]
}

export function AddComicForm({ characters }: AddComicFormProps) {
  const {
    values,
    setField,
    sortedCharacters,
    status,
    message,
    createdComic,
    handleSubmit,
    isSaving,
  } = useAddComicForm(characters)
  const characterSelectId = useId()
  const universeListId = useId()

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="space-y-5">
        <legend className="mb-4 text-xs font-bold uppercase tracking-widest text-dc-gold">
          Obrigatórios
        </legend>

        <div className="space-y-1.5">
          <label htmlFor={characterSelectId} className="block text-sm font-semibold text-white/80">
            Personagem
            <span aria-hidden="true" className="ml-1 text-dc-gold">
              *
            </span>
          </label>
          <select
            id={characterSelectId}
            name="characterId"
            required
            value={values.characterId}
            onChange={(event) => setField("characterId", event.target.value)}
            className={`${fieldClassName} cursor-pointer [&>option]:bg-dc-dark`}
          >
            <option value="" disabled>
              Selecione um personagem
            </option>
            {sortedCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Nome da HQ"
          field="title"
          value={values.title}
          onValueChange={setField}
          required
          maxLength={255}
          placeholder="Mulher-Gato Absoluta #1"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Número"
            field="issueNumber"
            value={values.issueNumber}
            onValueChange={setField}
            required
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="1"
            hint="Edição especial? Use número quebrado, como 13.5."
          />
          <Field
            label="Data de lançamento"
            field="releaseDate"
            value={values.releaseDate}
            onValueChange={setField}
            required
            type="date"
          />
        </div>

        <Field
          label="Link de download"
          field="downloadUrl"
          value={values.downloadUrl}
          onValueChange={setField}
          required
          type="url"
          maxLength={500}
          placeholder="https://www.mediafire.com/file/..."
        />

        <Field
          label="Universo"
          field="universe"
          value={values.universe}
          onValueChange={setField}
          required
          maxLength={100}
          list={universeListId}
          hint="Padrão: absolute."
        />
        <datalist id={universeListId}>
          {UNIVERSE_SUGGESTIONS.map((universe) => (
            <option key={universe} value={universe} />
          ))}
        </datalist>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-xs font-bold uppercase tracking-widest text-white/50">
          Opcionais
        </legend>

        <Field
          label="Link da capa"
          field="coverUrl"
          value={values.coverUrl}
          onValueChange={setField}
          type="url"
          maxLength={500}
          placeholder="https://static.dc.com/..."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Roteiro"
            field="writer"
            value={values.writer}
            onValueChange={setField}
            maxLength={255}
            placeholder="Che Grayson, Scott Snyder"
          />
          <Field
            label="Arte"
            field="artists"
            value={values.artists}
            onValueChange={setField}
            maxLength={500}
            placeholder="Bengal"
          />
        </div>

        <Field
          label="Editora"
          field="publisher"
          value={values.publisher}
          onValueChange={setField}
          maxLength={100}
          placeholder="DC Comics"
        />
      </fieldset>

      {status === "error" && message && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      {status === "success" && (
        <output className="block text-sm text-emerald-300">
          {message}
          {createdComic?.href && (
            <>
              {" "}
              <Link href={createdComic.href} className="font-semibold underline hover:text-white">
                Ver na página do personagem
              </Link>
            </>
          )}
        </output>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
        {isSaving ? "Salvando..." : "Adicionar HQ"}
      </Button>
    </form>
  )
}
