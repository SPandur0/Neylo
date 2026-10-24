// Denne skærm viser faste demo-råd og et lille spørgsmål-svar-flow, så appen kan demonstrere økonomisk vejledning uden ekstern service.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Icon, PageHeader } from '../Components/FinanceUI';
import { getAdvisorReply, insights } from '../data/mockData';
import { styles } from '../styles/styles';
export default function AdvisorScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  function askAdvisor() {
    if (!question.trim()) {
      setError('Skriv et spørgsmål, så hjælper jeg dig videre.');
      return;
    }
    setAnswer({
      question: question.trim(),
      text: getAdvisorReply(question)
    });
    setQuestion('');
    setError('');
  }
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <KeyboardAvoidingView style={styles.grow} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader eyebrow="MERE RO. MERE OVERBLIK." title="Din AI Advisor" subtitle="Små indsigter, der hjælper dig videre." />
        <View style={styles.advisorIntro}>
          <View style={styles.aiIcon}>
            <Icon name="sparkles" color="#fff" size={26} />
          </View>
          <Text style={styles.introTitle}>Din økonomi har muligheder.</Text>
          <Text style={styles.introText}>Her er 3 personlige indsigter baseret på dit økonomiske demo-overblik.</Text>
          <View style={styles.localBadge}>
            <View style={styles.dot} />
            <Text style={styles.demoText}>SIMULERET AI · LOKALE DATA</Text>
          </View>
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Udvalgt til dig</Text>
          <Text style={styles.muted}>03 indsigter</Text>
        </View>
        {insights.map(item => <View key={item.id} style={styles.insightCard}>
          <View style={styles.inline}>
            <View style={[styles.smallIcon, styles[item.tone]]}>
              <Icon name={item.icon} size={20} />
            </View>
            <Text style={styles.eyebrow}>{item.label}</Text>
          </View>
          <Text style={styles.insightTitle}>{item.title}</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </View>)}
        <View style={styles.askCard}>
          <Text style={styles.sectionTitle}>Hvad tænker du på?</Text>
          <Text style={styles.bodyText}>Spørg fx: Hvordan kan jeg spare mere op?</Text>
          <Text style={styles.inputLabel}>Dit spørgsmål</Text>
          <TextInput accessibilityLabel="Dit spørgsmål til AI Advisor" placeholder="Hvordan forbedrer jeg mit budget?" placeholderTextColor="#828b85" value={question} onChangeText={value => {
            setQuestion(value);
            setError('');
          }} multiline maxLength={500} style={styles.input} />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <ActionButton label="Spørg din Advisor" icon="sparkles-outline" onPress={askAdvisor} />
          {answer && <View accessibilityLiveRegion="polite" style={styles.answer}>
            <Text style={styles.answerQuestion}>{answer.question}</Text>
            <Text style={styles.eyebrow}>NEYLO · DEMOSVAR</Text>
            <Text style={styles.bodyText}>{answer.text}</Text>
          </View>}
        </View>
        <Text style={styles.footnote}>Svarene er faste demoeksempler, ikke personlig finansiel rådgivning. Ingen data sendes ud af appen.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
