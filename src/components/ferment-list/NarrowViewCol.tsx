import React from "react";
import { HiBellAlert, HiClock } from "react-icons/hi2";
import Details from "../Details";
import { type FermentEntry } from "../../types";
import { formatter, getFormattedVal } from "../../utils/formatter";
import { getDuration, getRemainingDuration } from "../../utils/time";

export default function NarrowViewCol(originalRowProps : FermentEntry) {
  const { 
    status,
    fermentName, 
    brinePercentage, 
    dateStart, 
    dateEnd, 
    notes, 
    tags,
    weight, 
    saltRequired,
    sendNotification,
    unit 
  } = originalRowProps;
  const start = dateStart ? new Date(dateStart) : undefined;
  const end = dateEnd ? new Date(dateEnd) : undefined;
  const remainingDuration = (dateStart && dateEnd) ? getRemainingDuration(dateStart, dateEnd) : undefined;

  return (
    <div className="ferment-list--narrow-cell">
      <div className="ferment-list--badges">
        {status && (
        <div className={`badge is-${status.toLowerCase()}`}>
          {status}
        </div>
        )}
        {remainingDuration && (
        <div className="badge is-info">
          <HiClock /> {remainingDuration} remaining
        </div>
        )}
        {sendNotification && status !== "Complete" && (
        <div className="badge is-info">
          <HiBellAlert /> On
        </div>
        )}
      </div>
      {fermentName && (
      <div className="ferment-list--name">
        <strong>{fermentName}</strong>
      </div>
      )}
      {dateStart && dateEnd && (
      <>
      <div className="ferment-list--time-entry">
        <span>{formatter.date.format(start)} - {formatter.date.format(end)} <br />({getDuration(dateStart, dateEnd)})</span>
      </div>
      </>
      )}
      <small>
        <div className="ferment-list--weight">
          <strong>Weight:</strong> {getFormattedVal(weight, unit)}
        </div>
        <div className="ferment-list--brine">
          <strong>Salt brine:</strong> {formatter.percent.format(brinePercentage / 100)}
        </div>
        <div className="ferment-list--salt-required">
          <strong>Salt required:</strong> {getFormattedVal(saltRequired, unit)}
        </div>
      </small>
      {notes && (
      <Details summary="View notes">{notes}</Details>
      )}
      {tags && tags.length > 0 && (
      <ul className="tags">
        {tags.map((tag, index) => (
          <li key={index} className="tag">{tag}</li>
        ))}
      </ul>
      )}
    </div>
  );
}