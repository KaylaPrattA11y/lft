import React, { useRef, useState, useMemo, useEffect, useContext } from "react";
import { HiExclamationCircle, HiPlus } from "react-icons/hi";
import Input from '../Input';
import RadioFieldset from "../RadioFieldset";
import CheckboxFieldset from "../CheckboxFieldset";
import DateRangePicker from "./DateRangePicker";
import { type DateValue } from '@internationalized/date';
import { type RangeValue } from 'react-aria';
import type { FermentDateRangePreset, FermentEntry, PresetUnit } from "../../types";
import Details from "../Details";
import { getDuration, getFermentDateRangePreset, getFermentStatus } from "../../utils/time";
import { toast } from "react-toastify";
import Tagger from "../Tagger";
import requestNotificationPermission from "../../utils/requestNotificationPermission";
import { NotificationsContext } from "../SpecialFeaturesContext";
import generateFermentName from "../../utils/generateFermentName";
import handleAddFerment from "../../utils/handleAddFerment";
import type { TabsController } from "../Tabs";
import { brinePercentagePresets, dateRangePresets } from "./constants";
import CalculatorJar from "./CalculatorJar";

export default function Calculator({ tabsController, isSmallScreen }: { tabsController?: TabsController, isSmallScreen: boolean }) {
  const canReceiveNotifications = useContext(NotificationsContext);
  const formRef = useRef<HTMLFormElement|null>(null);
  const [weight, setWeight] = useState<number|null>(null);
  const [presetUnit, setPresetUnit] = useState<PresetUnit>('grams');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [brinePercentage, setBrinePercentage] = useState<number|null>(2.2);
  const [saltRequired, setSaltRequired] = useState<number|null>(null);
  const [fermentName, setFermentName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  // default one-week
  const { start: defaultStart, end: defaultEnd } = getFermentDateRangePreset('one-week' as FermentDateRangePreset);
  const [fermentDateRange, setFermentDateRange] = useState<RangeValue<DateValue>|null>(
    defaultStart && defaultEnd ? { start: defaultStart, end: defaultEnd } : null
  );
  const [sendNotification, setFermentNotification] = useState<boolean>(false);
  const [showNotificationCheckbox, setShowNotificationCheckbox] = useState<boolean>(true);
  const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);
  const [showCustomBrinePercentageInput, setShowCustomBrinePercentageInput] = useState<boolean>(false);
  const [fermentTags, setFermentTags] = useState<Set<string>>(new Set());
  const [taggerKey, setTaggerKey] = useState<number>(0);

  // Derive unit from presetUnit and customUnit
  const unit = useMemo(() => {
    return presetUnit === 'other' ? customUnit : presetUnit;
  }, [presetUnit, customUnit]);

  const { dateStart, dateEnd } = useMemo(() => {
    return{
      dateStart: fermentDateRange?.start ? dateToStr(fermentDateRange.start) : undefined,
      dateEnd: fermentDateRange?.end ? dateToStr(fermentDateRange.end) : undefined
    }
  }, [fermentDateRange]);

  useEffect(() => {
    const salt = (Number(weight || 0) * Number(brinePercentage || 0)) / 100;
    setSaltRequired(salt);
  }, [weight, brinePercentage]);

  function dateToStr(date: DateValue | null) {
    if (!date) return '';
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  function handleChangePresetUnit(value: PresetUnit) {
    setPresetUnit(value);
    if (value !== 'other') {
      setCustomUnit('');
    }
  }

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    // let toastMessage = 'Ferment added successfully!';
    const stored = localStorage.getItem('fermentData');
    const parsed: FermentEntry[] = stored ? JSON.parse(stored) : [];
    const newEntry = {
      id: crypto.randomUUID(),
      weight: weight || 0,
      unit,
      brinePercentage: brinePercentage || 0,
      saltRequired: saltRequired || 0,
      fermentName: fermentName || generateFermentName(),
      notes,
      status: getFermentStatus(dateStart, dateEnd),
      dateCreated: new Date(),
      dateStart,
      dateEnd,
      sendNotification,
      tags: [...fermentTags]
    };
    const newEntries = [
      ...parsed,
      newEntry
    ];

    handleAddFerment(newEntry, newEntries, tabsController);

    if (sendNotification) {
      // toastMessage += ' A notification will be sent when this ferment is complete.';
      // Send notification scheduling to service worker
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SCHEDULE_FERMENT_NOTIFICATION',
          payload: {
            ferment: newEntries[newEntries.length - 1]
          }
        });
      }
    }
    // toast.success(toastMessage, {
    //   icon: <HiBadgeCheck color="var(--accent)" size="24px" />,
    //   position: "bottom-right",
    //   autoClose: 5000,
    //   onOpen() {
    //     setSubmitIsDisabled(true);
    //   },
    //   onClose() {        
    //     setSubmitIsDisabled(false);
    //   }
    // });
  }

  function handleReset() {
    setWeight(null);
    setBrinePercentage(2.2);
    setPresetUnit('grams');
    setCustomUnit('');
    setSaltRequired(null);
    setFermentName('');
    setNotes('');
    setFermentDateRange(null);
    setFermentNotification(false);
    setFermentTags(new Set());
    setShowDateRangePicker(false);
    setTaggerKey(prev => prev + 1);
  }

  return (
    <form ref={formRef} onSubmit={e => handleSubmit(e)} onReset={handleReset} className="calculator">
      <div className="calculator-grid">
        <div className="calculator-grid--left">
          <fieldset className="grid-salt">
            <legend className="visually-hidden">Calculate salt using:</legend>
            <div className="salt-calc-grid">
              <div>
                <Input 
                  label="Weight" 
                  id="weight"
                  name="weight" 
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={10000}
                  validationText="Please enter a weight between 0.01 and 10000."
                  value={String(weight || '')}
                  onChange={e => {
                    const raw = e.currentTarget.value;
                    const v = raw === '' ? null : parseFloat(raw);
                    setWeight(Number.isNaN(v as number) ? null : (v as number));
                  }}
                  required
                  helpText={unit ? <p>The <em>combined weight</em> of the food and water being fermented in {unit}. For example, if you are fermenting 500 {unit} of vegetables and 500 {unit} of brine, the total weight would be 1,000 {unit}.</p> : undefined}
                />
              </div>
              <div>
                <RadioFieldset 
                  className="unit-presets"
                  legend="Unit" 
                  name="presetUnit"
                  onChangeRadios={e => {
                    handleChangePresetUnit(e.target.value as PresetUnit);
                  }}
                  radios={[
                    {
                      label: "Grams",
                      id:"grams",
                      value:"grams",
                      defaultChecked: true
                    },
                    {
                      label: "Ounces",
                      id: "ounces",
                      value: "ounces",
                    },
                    {
                      label: "Other",
                      id: "other",
                      value: "other",
                    }
                  ]}
                >
                {presetUnit === 'other' ? (
                  <Input 
                    label="Custom presetUnit" 
                    showLabel={false}
                    id="presetUnit"
                    name="presetUnit" 
                    type="text"
                    validationText="Please enter a custom unit."
                    onChange={e => setCustomUnit(e.currentTarget.value)}
                    required
                  />
                  ) : undefined 
                }
                </RadioFieldset>
              </div>
            </div>
            <hr />
          </fieldset>
          <div className="grid-brine">
            <RadioFieldset
              className="brine-presets"
              legend="Salt Brine"
              orientation="horizontal"
              name="brinePercentage"
              onChangeRadios={e => {
                const val = e.target.value;

                setShowCustomBrinePercentageInput(val === 'custom');
                if (val === 'custom') {
                  setBrinePercentage(null);
                  return;
                }
                const numVal = parseFloat(val);
                setBrinePercentage(numVal);
              }}
              radios={brinePercentagePresets.map(p => ({
                label: p.label,
                id: p.id,
                value: String(p.value),
                subLabel: p.subLabel,
                defaultChecked: p.defaultChecked,
                required: true
              }))}
            />
            {showCustomBrinePercentageInput && (
            <>
            <Input 
              label="Salt brine" 
              showLabel={false}
              id="brine-percentage" 
              addon="%" 
              name="brinePercentage" 
              type="number" 
              step="0.1" 
              validationText="For your safety, please enter a value between 2-10%."
              value={String(brinePercentage || '')}
              onChange={e => {
                const raw = e.currentTarget.value;
                const v = raw === '' ? null : parseFloat(raw);
                setBrinePercentage(Number.isNaN(v as number) ? null : (v as number));
              }}
              min={2} 
              max={10} 
              required
            />
            </>
          )}
            <Details summary="Salt brine help">
              <p>The percentage of salt relative to the total weight. For example, if you want to use a 2% salt brine, enter 2. Common salt percentages for fermentation range from 2% to 10%, with 2-3% being common for vegetables and up to 5-6% for fish or meat.</p>
            </Details>
            <hr />
          </div>
          <div className="grid-fDate">
            <div>
              <RadioFieldset
                legend="Ferment duration"
                name="fermentDuration"
                orientation="horizontal"
                onChangeRadios={e => {
                  if (e.target.value === 'custom') {
                    setFermentDateRange(null);
                    setShowDateRangePicker(true);
                    return;
                  } else {
                    const { start, end } = getFermentDateRangePreset(e.target.value as FermentDateRangePreset);
                    if (start && end) {
                      setFermentDateRange({ start, end });
                      setShowDateRangePicker(false);
                    }
                  }
                }}
                radios={dateRangePresets.map(p => ({
                  label: p.label,
                  id: p.id,
                  value: p.value,
                  defaultChecked: p.defaultChecked,
                  required: true
                }))}
              ></RadioFieldset>
            </div>
            {showDateRangePicker && (
              <DateRangePicker onChange={value => setFermentDateRange(value)}/>
            )}
            {showDateRangePicker && fermentDateRange && dateStart && dateEnd && (
              <div>Duration: {getDuration(dateStart, dateEnd)}</div>
            )}
            {canReceiveNotifications !== false && showNotificationCheckbox && fermentDateRange && getFermentStatus(dateStart, dateEnd) !== "Complete" && (
            <CheckboxFieldset 
              legend="Fermentation completion reminder" 
              showLegend={false}
              checkboxes={[
                {
                  label: "Send a notification when this ferment is complete",
                  id: "sendNotification",
                  name: "sendNotification",
                  value: "true",
                  onChange: async (e) => {
                    const isChecked = e.currentTarget.checked;
                    setFermentNotification(isChecked);
                    // Request notification permission when checkbox is enabled
                    if (isChecked && 'Notification' in window) {
                      if (Notification.permission === 'default') {
                        await requestNotificationPermission({
                          onPermissionDenied: () => {
                            setShowNotificationCheckbox(false);
                            setFermentNotification(false);
                            toast.error('Notification permissions denied. Unable to schedule completion reminder.', {
                              position: "bottom-right",
                              icon: <HiExclamationCircle size="24px" />
                            });
                          }
                        });
                      }
                    }
                  },
                  checked: sendNotification
                }
              ]}
            />
            )}
            <hr />
          </div>
          <div className="grid-tags">
            <Tagger
              key={taggerKey}
              label="Tags (optional)" 
              id="tags" 
              name="tags"
              onChangeTags={setFermentTags}
              />
          </div>
        </div>
        <div className="calculator-grid--right">
          <div className="grid-fname">
            <Input 
              label="Ferment name (optional)" 
              id="ferment-name"
              name="fermentName" 
              value={fermentName}
              onChange={e => {
                const v = e.currentTarget.value;
                setFermentName(v);
              }}
              type="text"
            />
          </div>
          <div className="grid-fNotes">
            <div>
              <div>
                <label htmlFor="ferment-notes">Ferment notes (optional)</label>
                <textarea 
                  name="notes" 
                  id="ferment-notes"
                  value={notes}
                  maxLength={500}
                  onChange={e => {
                    const v = e.currentTarget.value;
                    setNotes(v);
                  }}
                  rows={4}></textarea>
              </div>
            </div>
          </div>
          <div className="grid-output">
            <CalculatorJar 
              saltRequired={saltRequired} 
              brinePercentage={brinePercentage} 
              unit={unit}
              weight={weight}
            />
            <hr />
          </div>
          {!isSmallScreen && (
          <div className="calculator-submit">
            <button type="submit" className="is-primary"><HiPlus size={16} /> Add ferment</button>
            <button type="reset" className="is-tertiary">Reset</button>
          </div>
          )}
        </div>
      </div>
      {isSmallScreen && (
      <div className="calculator-submit is-sticky">
        <button type="submit" className="is-primary"><HiPlus size={16} /> Add ferment</button>
        <button type="reset" className="is-tertiary">Reset</button>
      </div>
      )}
    </form>
  );
}