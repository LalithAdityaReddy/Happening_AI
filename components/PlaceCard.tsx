import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, ExternalLink } from 'lucide-react';
import { GroundingChunk } from '../types';

interface PlaceCardProps {
  content: string;
  chunks: GroundingChunk[];
}

const findMapLink = (placeName: string, chunks: GroundingChunk[]) => {
  // Clean the name: remove markdown bold, leading numbers/bullets, extra spaces
  const cleanName = placeName
    .replace(/\*\*/g, '')          // Remove bold
    .replace(/^[#\d.\-\s]+/, '')   // Remove leading "1. ", "# ", "- "
    .trim()
    .toLowerCase();

  return chunks.find(chunk => {
    if (chunk.maps) {
      const chunkTitle = chunk.maps.title.toLowerCase();
      // Check for inclusion in either direction
      return chunkTitle.includes(cleanName) || cleanName.includes(chunkTitle);
    }
    return false;
  });
};

export const PlaceCard: React.FC<PlaceCardProps> = ({ content, chunks }) => {
  const sections = content.split('###').filter(s => s.trim().length > 0);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, idx) => {
        // Detect if this section is just conversational intro text
        // (Usually doesn't have a Happening Meter or pipe separators)
        const isIntro = !section.includes("Happening Meter") && !section.includes("|");
        
        if (isIntro) {
            // Render as a clean text insight block
            return <InsightBlock key={idx} text={section} />;
        }
        
        return <RecommendationCard key={idx} section={section} chunks={chunks} />;
      })}
    </>
  );
};

// 1. Text Insight Block (Non-Card)
const InsightBlock: React.FC<{ text: string }> = ({ text }) => {
    // Only render if substantial text
    if (text.length < 10) return null;
    return (
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 mb-2">
            <div className="flex items-start gap-3">
                <div className="mt-1 w-1 h-12 bg-amber-400 rounded-full shrink-0"></div>
                <p className="text-neutral-400 text-sm leading-relaxed font-light">{text.trim()}</p>
            </div>
        </div>
    );
};

// 2. Main Recommendation Card (NO IMAGES, Text-First)
const RecommendationCard: React.FC<{ section: string; chunks: GroundingChunk[] }> = ({ section, chunks }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
      setMounted(true);
  }, []);

  const lines = section.trim().split('\n');
  const titleLine = lines[0];
  const title = titleLine.replace(/\*\*/g, '').trim(); // Remove bold markers from title
  const fullText = lines.slice(1).join('\n');

  // Parse Score
  const scoreMatch = fullText.match(/Happening Meter:.*?(\d+)/i);
  let score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  if (isNaN(score)) score = 0;

  // Color Logic (Strictly Gold or Orange)
  const isGoldTier = score >= 80;
  const scoreColor = isGoldTier ? "text-amber-400" : "text-orange-500";
  const barColor = isGoldTier ? "bg-amber-400" : "bg-orange-500";
  const glowShadow = isGoldTier ? "shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "shadow-none";

  // Parse Metadata
  const metaLine = lines.find(line => line.includes('|'));
  let category = 'Spot';
  let distance = '';
  let time = '';
  
  if (metaLine) {
      const parts = metaLine.split('|').map(s => s.replace(/\*\*/g, '').trim());
      if (parts.length >= 1) category = parts[0];
      if (parts.length >= 2) distance = parts[1];
      if (parts.length >= 3) time = parts[2];
  }

  // Parse "Why"
  let whyText = "";
  const whyMatch = fullText.match(/\*\*Why:?\*\*\s*([\s\S]*?)(?=\n\[|$)/i);
  if (whyMatch) {
      whyText = whyMatch[1].trim();
  } else {
      whyText = lines.filter(l => 
        !l.includes('Happening Meter:') && 
        !l.includes('|') && 
        !l.includes('###') &&
        l.trim().length > 0
      ).join(' ').trim();
  }

  // Match map link using the title (which is now encouraged to be the Venue Name)
  const grounding = findMapLink(title, chunks);

  return (
    <div className={`group relative bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 md:p-8 transition-all hover:border-neutral-700 ${glowShadow}`}>
      
      <div className="flex flex-col gap-6">
          
          {/* Header Row: Title & Link */}
          <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">{title}</h3>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wider font-semibold text-neutral-500">
                      <span className={isGoldTier ? "text-amber-400" : "text-neutral-400"}>{category}</span>
                      {distance && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                            <span>{distance}</span>
                          </>
                      )}
                  </div>
              </div>

              {grounding?.maps && (
                  <a 
                      href={grounding.maps.uri} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-orange-500 hover:bg-neutral-800 transition-all shrink-0"
                      title="View on Google Maps"
                  >
                      <Navigation size={18} />
                  </a>
              )}
          </div>

          {/* Happening Score UI (Mandatory & Prominent) */}
          <div className="py-2">
              <div className="flex items-end justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Happening Score</span>
                  <span className={`text-2xl font-bold ${scoreColor} tabular-nums`}>{score}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${barColor} transition-all duration-1000 ease-out`} 
                    style={{ width: mounted ? `${score}%` : '0%' }}
                  ></div>
              </div>
          </div>

          {/* Recommendation Text */}
          <div className="relative">
             <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neutral-800"></div>
             <p className="pl-4 text-sm text-neutral-400 leading-relaxed font-normal">
                 {whyText}
             </p>
          </div>
          
          {/* Time Badge (if event) */}
          {time && (
              <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-orange-500" />
                  <span className="text-sm font-medium text-neutral-300">{time}</span>
              </div>
          )}

      </div>
    </div>
  );
};