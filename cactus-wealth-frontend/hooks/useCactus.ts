import { useState, useEffect } from 'react';
import { cactusService, type Idea, type ContentMatrix, type VideoSlot, type LibraryItem, type ExternalLink } from '@/services/cactus';
import { awsSecretsService, type SecureCredential } from '@/services/awsSecrets';

export function useCactusData() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [contentMatrix, setContentMatrix] = useState<ContentMatrix[]>([]);
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [secureCredentials, setSecureCredentials] = useState<SecureCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        ideasData,
        contentMatrixData,
        videoSlotsData,
        libraryItemsData,
        externalLinksData,
        secureCredentialsData,
      ] = await Promise.allSettled([
        cactusService.getIdeas(),
        cactusService.getContentMatrix(),
        cactusService.getVideoSlots(),
        cactusService.getLibraryItems(),
        cactusService.getExternalLinks(),
        awsSecretsService.getCredentials(),
      ]);

      if (ideasData.status === 'fulfilled') {
        setIdeas(ideasData.value);
      }
      if (contentMatrixData.status === 'fulfilled') {
        setContentMatrix(contentMatrixData.value);
      }
      if (videoSlotsData.status === 'fulfilled') {
        setVideoSlots(videoSlotsData.value);
      }
      if (libraryItemsData.status === 'fulfilled') {
        setLibraryItems(libraryItemsData.value);
      }
      if (externalLinksData.status === 'fulfilled') {
        setExternalLinks(externalLinksData.value);
      }
      if (secureCredentialsData.status === 'fulfilled') {
        setSecureCredentials(secureCredentialsData.value);
      }

      // Check for any errors
      const errors = [
        ideasData,
        contentMatrixData,
        videoSlotsData,
        libraryItemsData,
        externalLinksData,
        secureCredentialsData,
      ]
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        console.warn('Some data failed to load:', errors);
        setError('Algunos datos no se pudieron cargar completamente');
      }
    } catch (err) {
      console.error('Error fetching Cactus data:', err);
      setError('Error al cargar los datos del módulo Cactus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshData = () => {
    fetchAllData();
  };

  return {
    ideas,
    contentMatrix,
    videoSlots,
    libraryItems,
    externalLinks,
    secureCredentials,
    loading,
    error,
    refreshData,
    setIdeas,
    setContentMatrix,
    setVideoSlots,
    setLibraryItems,
    setExternalLinks,
    setSecureCredentials,
  };
}

export function useIdeasManager() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cactusService.getIdeas();
      setIdeas(data);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError('Error al cargar las ideas');
    } finally {
      setLoading(false);
    }
  };

  const createIdea = async (ideaData: Parameters<typeof cactusService.createIdea>[0]) => {
    try {
      setError(null);
      const newIdea = await cactusService.createIdea(ideaData);
      setIdeas(prev => [...prev, newIdea]);
      return newIdea;
    } catch (err) {
      console.error('Error creating idea:', err);
      setError('Error al crear la idea');
      throw err;
    }
  };

  const updateIdea = async (id: string, ideaData: Parameters<typeof cactusService.updateIdea>[1]) => {
    try {
      setError(null);
      const updatedIdea = await cactusService.updateIdea(id, ideaData);
      setIdeas(prev => prev.map(idea => idea.id === id ? updatedIdea : idea));
      return updatedIdea;
    } catch (err) {
      console.error('Error updating idea:', err);
      setError('Error al actualizar la idea');
      throw err;
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      setError(null);
      await cactusService.deleteIdea(id);
      setIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (err) {
      console.error('Error deleting idea:', err);
      setError('Error al eliminar la idea');
      throw err;
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  return {
    ideas,
    loading,
    error,
    createIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas: fetchIdeas,
  };
}

export function useSecureCredentials() {
  const [credentials, setCredentials] = useState<SecureCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await awsSecretsService.getCredentials();
      setCredentials(data);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError('Error al cargar las credenciales');
    } finally {
      setLoading(false);
    }
  };

  const createCredential = async (credentialData: Parameters<typeof awsSecretsService.createCredential>[0]) => {
    try {
      setError(null);
      const newCredential = await awsSecretsService.createCredential(credentialData);
      setCredentials(prev => [...prev, newCredential]);
      return newCredential;
    } catch (err) {
      console.error('Error creating credential:', err);
      setError('Error al crear la credencial');
      throw err;
    }
  };

  const updateCredential = async (id: string, credentialData: Parameters<typeof awsSecretsService.updateCredential>[1]) => {
    try {
      setError(null);
      const updatedCredential = await awsSecretsService.updateCredential(id, credentialData);
      setCredentials(prev => prev.map(cred => cred.id === id ? updatedCredential : cred));
      return updatedCredential;
    } catch (err) {
      console.error('Error updating credential:', err);
      setError('Error al actualizar la credencial');
      throw err;
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      setError(null);
      await awsSecretsService.deleteCredential(id);
      setCredentials(prev => prev.filter(cred => cred.id !== id));
    } catch (err) {
      console.error('Error deleting credential:', err);
      setError('Error al eliminar la credencial');
      throw err;
    }
  };

  const getCredentialValue = async (id: string) => {
    try {
      setError(null);
      return await awsSecretsService.getCredentialValue(id);
    } catch (err) {
      console.error('Error getting credential value:', err);
      setError('Error al obtener el valor de la credencial');
      throw err;
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  return {
    credentials,
    loading,
    error,
    createCredential,
    updateCredential,
    deleteCredential,
    getCredentialValue,
    refreshCredentials: fetchCredentials,
  };
}