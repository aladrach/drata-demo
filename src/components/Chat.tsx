import ChatClient from "@/components/ChatClient";
import { listChatbotCTAs, listChatbotFaqSuggestions, listChatbotFeaturedPages } from "@/lib/cms/contentful";

export default async function Chat() {
  const [recommendedQuestions, featuredPages, ctaItems] = await Promise.all([
    listChatbotFaqSuggestions().catch(() => []),
    listChatbotFeaturedPages().catch(() => []),
    listChatbotCTAs().catch(() => []),
  ]);

  return (
    <ChatClient
      initialRecommendedQuestions={recommendedQuestions}
      initialFeaturedPages={featuredPages}
      initialCtaItems={ctaItems}
    />
  );
}


