import React, { FC } from "react";
import DashedDropzone from "./DashedDropzone";

interface FileInputProps {
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

const FileInput: FC<FileInputProps> = ({ className, onChange, accept, multiple, disabled }) => {
  return (
    <DashedDropzone
      onChange={onChange || (() => {})}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      className={className}
    />
  );
};

export default FileInput;
