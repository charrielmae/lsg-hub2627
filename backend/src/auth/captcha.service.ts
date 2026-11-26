import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

interface CaptchaJwtPayload {
  purpose: 'captcha';
  jti: string;
  answerHash: string;
  iat?: number;
  exp?: number;
}

const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAPTCHA_LENGTH = 5;
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CHAR_COLORS = ['#1E160C', '#3B2A14', '#B84A00', '#D95D00', '#1E160C'];

@Injectable()
export class CaptchaService {
  private readonly consumedTokens = new Map<string, number>();

  constructor(private readonly jwtService: JwtService) {}

  async createChallenge(): Promise<{
    captchaToken: string;
    imageDataUrl: string;
    expiresInSeconds: number;
  }> {
    this.pruneConsumedTokens();

    const code = this.generateCode(CAPTCHA_LENGTH);
    const jti = randomBytes(12).toString('hex');
    const answerHash = this.hashAnswer(jti, code);

    const payload: CaptchaJwtPayload = {
      purpose: 'captcha',
      jti,
      answerHash,
    };

    const captchaToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    const svg = this.renderSvg(code);
    const imageDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

    return {
      captchaToken,
      imageDataUrl,
      expiresInSeconds: CAPTCHA_TTL_MS / 1000,
    };
  }

  async verifyChallenge(
    captchaToken: string,
    captchaAnswer: string,
  ): Promise<void> {
    this.pruneConsumedTokens();

    if (!captchaToken || !captchaAnswer?.trim()) {
      throw new BadRequestException('Please complete the CAPTCHA verification.');
    }

    let payload: CaptchaJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<CaptchaJwtPayload>(
        captchaToken,
      );
    } catch {
      throw new BadRequestException(
        'CAPTCHA expired or invalid. Please enter the new code.',
      );
    }

    if (payload.purpose !== 'captcha' || !payload.jti || !payload.answerHash) {
      throw new BadRequestException('Invalid CAPTCHA challenge token.');
    }

    if (this.consumedTokens.has(payload.jti)) {
      throw new BadRequestException(
        'CAPTCHA has already been used. Please enter the new code.',
      );
    }

    // Consume token immediately to prevent replay attacks
    const expiresAt = payload.exp
      ? payload.exp * 1000
      : Date.now() + CAPTCHA_TTL_MS;
    this.consumedTokens.set(payload.jti, expiresAt);

    const expectedBuf = Buffer.from(payload.answerHash, 'hex');
    const actualBuf = Buffer.from(
      this.hashAnswer(payload.jti, captchaAnswer.trim().toUpperCase()),
      'hex',
    );

    if (
      expectedBuf.length !== actualBuf.length ||
      !timingSafeEqual(expectedBuf, actualBuf)
    ) {
      throw new BadRequestException(
        'Incorrect CAPTCHA code. Please try again with the new code.',
      );
    }
  }

  private generateCode(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CAPTCHA_ALPHABET[randomInt(0, CAPTCHA_ALPHABET.length)];
    }
    return result;
  }

  private hashAnswer(jti: string, normalizedCode: string): string {
    return createHash('sha256')
      .update(`ccislsg-captcha:${jti}:${normalizedCode}`)
      .digest('hex');
  }

  private pruneConsumedTokens(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.consumedTokens.entries()) {
      if (expiresAt <= now) {
        this.consumedTokens.delete(jti);
      }
    }
  }

  private renderSvg(code: string): string {
    const width = 160;
    const height = 48;

    let noisePaths = '';
    for (let i = 0; i < 4; i++) {
      const y1 = randomInt(8, height - 8);
      const y2 = randomInt(8, height - 8);
      const cx1 = randomInt(30, 75);
      const cy1 = randomInt(4, height - 4);
      const cx2 = randomInt(85, 130);
      const cy2 = randomInt(4, height - 4);
      const stroke = i % 2 === 0 ? '#FF8E13' : '#3B2A14';
      const opacity = i % 2 === 0 ? '0.42' : '0.24';
      noisePaths += `<path d="M 4 ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${width - 4} ${y2}" stroke="${stroke}" stroke-width="1.5" stroke-opacity="${opacity}" fill="none" />`;
    }

    let noiseDots = '';
    for (let i = 0; i < 24; i++) {
      const cx = randomInt(6, width - 6);
      const cy = randomInt(6, height - 6);
      const r = randomInt(1, 3) * 0.65;
      const fill = i % 3 === 0 ? '#FF8113' : '#3B2A14';
      const opacity = i % 3 === 0 ? '0.35' : '0.2';
      noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${fill}" opacity="${opacity}" />`;
    }

    const charsSvg = code
      .split('')
      .map((char, index) => {
        const x = 22 + index * 28 + randomInt(-2, 3);
        const y = 31 + randomInt(-4, 4);
        const rotate = randomInt(-18, 19);
        const color = CHAR_COLORS[index % CHAR_COLORS.length];
        return `<text x="${x}" y="${y}" fill="${color}" font-family="'Courier New', Courier, monospace" font-size="24" font-weight="700" text-anchor="middle" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Security verification code">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFDF4" />
          <stop offset="60%" stop-color="#FBF4C3" />
          <stop offset="100%" stop-color="#FAC864" stop-opacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="6" fill="url(#bg)" />
      ${noiseDots}
      ${noisePaths}
      ${charsSvg}
    </svg>`;
  }
}
