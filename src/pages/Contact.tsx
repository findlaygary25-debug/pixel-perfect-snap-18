import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: `Thanks ${name}! We'll reply to ${email}.`,
    });
    setName(""); 
    setEmail(""); 
    setMessage("");
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <form onSubmit={submit} className="grid gap-4">
        <Input 
          placeholder="Your name" 
          value={name} 
          onChange={e => setName(e.target.value)}
          required
        />
        <Input 
          placeholder="Your email" 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Textarea 
          placeholder="Your message" 
          value={message} 
          onChange={e => setMessage(e.target.value)}
          className="min-h-[140px]"
          required
        />
        <Button type="submit">Send</Button>
      </form>
    </main>
  );
};
export default Contact;
