"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFormContext } from "react-hook-form";

import classes from "./lazy-incremental-search-select.module.scss";

type option = { value: string; label: string };

interface IncrementalSearchSelectProps {
  name: string;
  fetch: () => Promise<option[]>;
  label?: string;
}

const IncrementalSearchSelect: React.FC<IncrementalSearchSelectProps> = ({
  name,
  fetch,
  label,
}) => {
  const { register, setValue, watch } = useFormContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<option[]>([]);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
      return;
    }
    setFilteredOptions(
      options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, options]);

  const reflectValueToSearchTerm = (incoming: string) => {
    const destinations = options.filter((x) => x.value === incoming);
    const destination = destinations.length > 0 ? destinations[0] : null;
    if (destination) {
      setSearchTerm(destination.label);
      setValue(name, destination.value);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    reflectValueToSearchTerm(e.target.value);
  };

  const value = watch(name);
  useEffect(() => {
    reflectValueToSearchTerm(value);
  }, [value]);

  const handleOptionClick = (option: { value: string; label: string }) => {
    setSearchTerm(option.label);
    setValue(name, option.value);
    setIsOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, "");
    setSearchTerm(e.target.value);
  };

  const handleSearchFocus = async () => {
    setIsOpen(true);
    if (loaded.current || isLoading) return;
    setIsLoading(true);
    setOptions(await fetch());
    setIsLoading(false);
    loaded.current = true;
  };

  const handleSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (!selectRef.current?.contains(e.relatedTarget)) {
        setIsOpen(false);
      }
    }, 100);
  };

  return (
    <div className={classes.container} ref={selectRef}>
      {label && (
        <label htmlFor={name} className={classes.label}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <input
          type="text"
          id={name}
          className={`${classes.select} ${loaded.current || isLoading ? classes.loaded : ""}`}
          value={searchTerm}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onChange={handleSearchChange}
          autoComplete="off"
        />
        <input
          type="text"
          hidden
          {...register(name, {
            onChange: handleValueChange,
          })}
        />
        {isOpen ? (
          <ul className={classes.list}>
            {isLoading ? (
              <li className={classes.option}>Loading</li>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={classes.option}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </li>
              ))
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default IncrementalSearchSelect;
