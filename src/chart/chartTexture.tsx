/**
 * The texture channel — identity where hue cannot carry it.
 *
 * Earns its place only for full colour-vision deficiency, greyscale print, and
 * `forced-colors`. It is **never decorative and never on by default**: dense
 * angled fields are a vestibular risk and read as noise on a value scale.
 *
 * One directional hatch, used at 45° and its 135° mirror only. Horizontal and
 * vertical are deliberately excluded — they read as gridlines and as bars.
 */
import { Defs, Line, Pattern } from "react-native-svg";

import { TEXTURE_ANGLES, texturePatternId } from "./chartTextureModel";

export {
  TEXTURE_ANGLES,
  textureFill,
  texturePatternId,
  type TextureAngle,
} from "./chartTextureModel";

/**
 * Pattern definitions for a set of series.
 *
 * Slots alternate between the two angles, and the stroke is a tone of the
 * series' own colour rather than a contrasting one, so every slot carries the
 * same visual weight — a texture that shouts on one series and whispers on
 * another re-ranks the data.
 */
export function ChartTextureDefs({
  series,
}: {
  series: readonly { id: string; color: string }[];
}) {
  return (
    <Defs>
      {series.map((entry, index) => {
        const angle = TEXTURE_ANGLES[index % TEXTURE_ANGLES.length];
        const id = texturePatternId(entry.id);
        return (
          <Pattern
            height={6}
            id={id}
            key={id}
            patternTransform={`rotate(${angle})`}
            patternUnits="userSpaceOnUse"
            width={6}
          >
            <Line
              stroke={entry.color}
              strokeWidth={2.5}
              x1={0}
              x2={0}
              y1={0}
              y2={6}
            />
          </Pattern>
        );
      })}
    </Defs>
  );
}
