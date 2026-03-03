// Import all driver images statically so Vite bundles them correctly
import alb from "../assets/drivers/alb.png";
import alo from "../assets/drivers/alo.png";
import ant from "../assets/drivers/ant.png";
import bea from "../assets/drivers/bea.png";
import bor from "../assets/drivers/bor.png";
import bot from "../assets/drivers/bot.png";
import col from "../assets/drivers/col.png";
import gas from "../assets/drivers/gas.png";
import had from "../assets/drivers/had.png";
import ham from "../assets/drivers/ham.png";
import hul from "../assets/drivers/hul.png";
import law from "../assets/drivers/law.png";
import lec from "../assets/drivers/lec.png";
import nor from "../assets/drivers/nor.png";
import oco from "../assets/drivers/oco.png";
import per from "../assets/drivers/per.png";
import pia from "../assets/drivers/pia.png";
import rus from "../assets/drivers/rus.png";
import sai from "../assets/drivers/sai.png";
import str from "../assets/drivers/str.png";
import ver from "../assets/drivers/ver.png";

const IMAGES: Record<string, string> = {
  alb, alo, ant, bea, bor, bot, col, gas, had, ham,
  hul, law, lec, nor, oco, per, pia, rus, sai, str, ver,
};

interface DriverImageProps {
  abbreviation: string;
  className?: string;
}

export function DriverImage({
  abbreviation,
  className = "inline-block h-12 w-12",
}: DriverImageProps) {
  const src = IMAGES[abbreviation.toLowerCase()];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={abbreviation}
      className={className}
      loading="lazy"
    />
  );
}
